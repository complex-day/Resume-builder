"""Verification test suite for backend hardening fixes (WC-1, WC-3, WC-5, WC-6, WC-7)."""

import json
from pathlib import Path
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from starlette.middleware.cors import CORSMiddleware

from app.main import app
from app.agents.jd_decoder import detect_portal_from_url
from app.schemas.truth_vault import MasterTruthVault, Project

client = TestClient(app)


def test_cors_hardening():
    """WC-1: Verify CORS does not use wildcard origins and allows Chrome extensions."""
    print("[HARDENING 1] Verifying CORS Configuration (WC-1):")
    # Inspect registered middlewares on app
    cors_middleware = None
    for middleware in app.user_middleware:
        if middleware.cls == CORSMiddleware:
            cors_middleware = middleware
            break

    assert cors_middleware is not None, "CORSMiddleware must be registered"
    allow_origins = cors_middleware.kwargs.get("allow_origins", [])
    allow_origin_regex = cors_middleware.kwargs.get("allow_origin_regex", "")

    print(f"  allow_origins: {allow_origins}")
    print(f"  allow_origin_regex: {allow_origin_regex}")

    assert "*" not in allow_origins, "Wildcard '*' must NOT be in allow_origins"
    assert "http://localhost:3000" in allow_origins
    assert allow_origin_regex == r"^chrome-extension://.*$"

    # Test preflight options request with localhost
    resp = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"

    # Test preflight options request with chrome-extension
    ext_resp = client.options(
        "/health",
        headers={
            "Origin": "chrome-extension://abcdefghijklmnop",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert ext_resp.headers.get("access-control-allow-origin") == "chrome-extension://abcdefghijklmnop"

    # Test disallowed origin
    bad_resp = client.options(
        "/health",
        headers={
            "Origin": "https://malicious-site.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert bad_resp.headers.get("access-control-allow-origin") is None
    print("  CORS hardening verified successfully.\n")


def test_strict_hostname_portal_detection():
    """WC-6: Strict hostname matching for job portal detection."""
    print("[HARDENING 2] Verifying Strict Hostname Portal Matching (WC-6):")
    # Substring trap URL: contains 'nats' in domain name but is NOT the government portal
    trap_url = "https://careers.nats-technologies.com/jobs/123"
    trap_result = detect_portal_from_url(trap_url)
    print(f"  URL: {trap_url} -> Detected: '{trap_result}'")
    assert trap_result == "unknown", f"Expected 'unknown', got '{trap_result}'"

    # Legitimate NATS government portal
    real_nats = "https://nats.education.gov.in/student_type.php"
    real_nats_result = detect_portal_from_url(real_nats)
    print(f"  URL: {real_nats} -> Detected: '{real_nats_result}'")
    assert real_nats_result == "nats"

    # Substring trap for PMIS
    pmis_trap = "https://my-company.com/jobs/pmis-trainee"
    pmis_trap_result = detect_portal_from_url(pmis_trap)
    print(f"  URL: {pmis_trap} -> Detected: '{pmis_trap_result}'")
    assert pmis_trap_result == "unknown"

    # Real PMIS portal
    real_pmis = "https://pminternship.mca.gov.in/portal/opportunities"
    real_pmis_result = detect_portal_from_url(real_pmis)
    print(f"  URL: {real_pmis} -> Detected: '{real_pmis_result}'")
    assert real_pmis_result == "pmis"

    print("  Strict hostname matching verified successfully.\n")


def test_merge_transparency_skipped_ids():
    """WC-5: Verify skipped_project_ids in GitHub sync response (deterministic offline mock)."""
    print("[HARDENING 3] Verifying Merge Transparency (WC-5):")
    user_id = "test_hardening_user"
    sample_vault_path = Path(__file__).parent / "sample_vault.json"
    with open(sample_vault_path, "r", encoding="utf-8") as f:
        sample_vault_data = json.load(f)

    # Clean up before
    data_dir = Path(__file__).parent / "data" / "vaults"
    user_file = data_dir / f"{user_id}.json"
    if user_file.exists():
        user_file.unlink()

    mock_projects = [
        Project(
            id="fastapi-offline-mock",
            name="FastAPI Offline Mock",
            description="Deterministic mock project for test verification",
            tech_stack=["Python", "FastAPI"],
            repo_url="https://github.com/tiangolo/fastapi-offline-mock",
        ),
        Project(
            id="typer-offline-mock",
            name="Typer Offline Mock",
            description="Deterministic mock project for test verification",
            tech_stack=["Python", "Typer"],
            repo_url="https://github.com/tiangolo/typer-offline-mock",
        ),
    ]

    try:
        # Save vault
        put_resp = client.put(f"/api/v1/vault/{user_id}", json=sample_vault_data)
        assert put_resp.status_code == 200, f"Expected 200 for vault save, got {put_resp.status_code}: {put_resp.text}"

        with patch("app.api.vault.fetch_github_projects", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = mock_projects

            # Sync 1: imports up to 2 repos
            sync1 = client.post(f"/api/v1/vault/{user_id}/sync-github/tiangolo?max_repos=2")
            assert sync1.status_code == 200, f"Expected 200 for Sync 1, got {sync1.status_code}: {sync1.text}"
            data1 = sync1.json()
            print(f"  Sync 1: newly_added={data1['newly_added_count']}, skipped={data1['skipped_project_ids']}")
            assert "skipped_project_ids" in data1, "skipped_project_ids key must be in Sync 1 response"
            assert data1["newly_added_count"] == 2, f"Expected newly_added_count == 2, got {data1['newly_added_count']}"
            assert len(data1["skipped_project_ids"]) == 0, f"Expected 0 skipped projects in Sync 1, got {data1['skipped_project_ids']}"

            # Sync 2: all 2 repos should be skipped
            sync2 = client.post(f"/api/v1/vault/{user_id}/sync-github/tiangolo?max_repos=2")
            assert sync2.status_code == 200, f"Expected 200 for Sync 2, got {sync2.status_code}: {sync2.text}"
            data2 = sync2.json()
            print(f"  Sync 2: newly_added={data2['newly_added_count']}, skipped={data2['skipped_project_ids']}")
            assert "skipped_project_ids" in data2, "skipped_project_ids key must be in Sync 2 response"
            assert data2["newly_added_count"] == 0, f"Expected newly_added_count == 0, got {data2['newly_added_count']}"
            assert len(data2["skipped_project_ids"]) == 2, f"Expected 2 skipped projects in Sync 2, got {data2['skipped_project_ids']}"
            assert "fastapi-offline-mock" in data2["skipped_project_ids"]
            assert "typer-offline-mock" in data2["skipped_project_ids"]
            print("  Merge transparency and skipped project tracking verified successfully.\n")

    finally:
        if user_file.exists():
            user_file.unlink()


def run_all_hardening_tests():
    print("=== Running Backend Hardening Verification Suite ===\n")
    test_cors_hardening()
    test_strict_hostname_portal_detection()
    test_merge_transparency_skipped_ids()
    print("=== ALL BACKEND HARDENING TESTS PASSED SUCCESSFULLY ===")


if __name__ == "__main__":
    run_all_hardening_tests()
