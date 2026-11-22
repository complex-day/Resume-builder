"""Verification test suite for backend hardening fixes (WC-1, WC-3, WC-5, WC-6, WC-7, Rate Limiting, Security Headers)."""

import json
import os
from pathlib import Path
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from starlette.middleware.cors import CORSMiddleware

from app.main import app
from app.limiter import limiter
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


def test_security_headers():
    """Verify security headers are applied to HTTP endpoints (including /health)."""
    print("[HARDENING 2] Verifying Security Headers Middleware:")
    resp = client.get("/health")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"

    assert resp.headers.get("x-content-type-options") == "nosniff", "Missing X-Content-Type-Options: nosniff"
    assert resp.headers.get("x-frame-options") == "DENY", "Missing X-Frame-Options: DENY"
    assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin", "Missing Referrer-Policy"

    print(f"  X-Content-Type-Options: {resp.headers.get('x-content-type-options')}")
    print(f"  X-Frame-Options: {resp.headers.get('x-frame-options')}")
    print(f"  Referrer-Policy: {resp.headers.get('referrer-policy')}")
    print("  Security headers verified successfully.\n")


def test_rate_limiting():
    """Verify IP rate limiting on LLM endpoints: returns 429 when exceeded and toggles via RATE_LIMIT_ENABLED."""
    print("[HARDENING 3] Verifying IP Rate Limiting & 429 Handling:")
    test_ip = "198.51.100.42"
    headers = {"X-Forwarded-For": test_ip}

    # Reset limiter storage before testing
    limiter.reset()

    # Enable rate limiting with strict 2 requests per minute limit
    os.environ["RATE_LIMIT_ENABLED"] = "true"
    os.environ["RATE_LIMIT_PER_MINUTE"] = "2"
    payload = {
        "raw_jd_text": "Software engineer with distributed backend microservices experience.",
        "user_id": "non_existent_test_user",
    }

    try:
        # Request 1: Should pass through to endpoint
        r1 = client.post("/api/v1/pipeline/run", json=payload, headers=headers)
        assert r1.status_code != 429, f"Request 1 unexpectedly rate limited: {r1.status_code}"
        print(f"  Request 1: Status {r1.status_code} (Allowed)")

        # Request 2: Should pass through to endpoint
        r2 = client.post("/api/v1/pipeline/run", json=payload, headers=headers)
        assert r2.status_code != 429, f"Request 2 unexpectedly rate limited: {r2.status_code}"
        print(f"  Request 2: Status {r2.status_code} (Allowed)")

        # Request 3: Must trigger HTTP 429 Rate Limit Exceeded
        r3 = client.post("/api/v1/pipeline/run", json=payload, headers=headers)
        print(f"  Request 3: Status {r3.status_code} (Rate Limited)")
        assert r3.status_code == 429, f"Expected 429 for Request 3, got {r3.status_code}: {r3.text}"
        data3 = r3.json()
        assert "error" in data3, "Response JSON must contain 'error' key"
        assert "detail" in data3, "Response JSON must contain 'detail' key"
        assert "Rate limit exceeded" in data3["detail"]
        print(f"  Request 3 429 JSON response: {data3}")

        # Test toggle: RATE_LIMIT_ENABLED=false disables rate limiting
        os.environ["RATE_LIMIT_ENABLED"] = "false"
        r4 = client.post("/api/v1/pipeline/run", json=payload, headers=headers)
        print(f"  Request 4 (RATE_LIMIT_ENABLED=false): Status {r4.status_code}")
        assert r4.status_code != 429, f"Expected rate limiting to be bypassed when disabled, got {r4.status_code}"
        print("  Rate limit toggle via RATE_LIMIT_ENABLED verified successfully.\n")

    finally:
        # Restore defaults
        os.environ["RATE_LIMIT_ENABLED"] = "true"
        os.environ["RATE_LIMIT_PER_MINUTE"] = "5"
        limiter.reset()


def test_strict_hostname_portal_detection():
    """WC-6: Strict hostname matching for job portal detection."""
    print("[HARDENING 4] Verifying Strict Hostname Portal Matching (WC-6):")
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
    print("[HARDENING 5] Verifying Merge Transparency (WC-5):")
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
    test_security_headers()
    test_rate_limiting()
    test_strict_hostname_portal_detection()
    test_merge_transparency_skipped_ids()
    print("=== ALL BACKEND HARDENING TESTS PASSED SUCCESSFULLY ===")


if __name__ == "__main__":
    run_all_hardening_tests()
