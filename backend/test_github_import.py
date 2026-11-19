"""Acceptance tests for GitHub auto-importer service and route regression."""

import json
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.truth_vault import Project

client = TestClient(app)


def run_tests():
    print("=== Running GitHub Auto-Import Acceptance & Regression Tests ===\n")

    # 1. Test GitHub Import with stable public user (tiangolo, max_repos=3)
    username = "tiangolo"
    max_repos = 3
    print(f"[TEST 1] GET /api/v1/vault/import/github/{username}?max_repos={max_repos}")
    resp = client.get(f"/api/v1/vault/import/github/{username}?max_repos={max_repos}")
    print(f"Status Code: {resp.status_code}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    data = resp.json()
    assert data["username"] == username
    assert "imported_count" in data
    assert "projects" in data
    assert len(data["projects"]) <= max_repos
    assert data["imported_count"] == len(data["projects"])
    print(f"Successfully imported {data['imported_count']} non-forked repos.")

    # Validate each imported project strictly against Pydantic Project schema
    validated_projects = []
    for raw_p in data["projects"]:
        project_obj = Project.model_validate(raw_p)
        assert project_obj.highlights == [], "Highlights must be empty per truth-vault-rule"
        assert project_obj.metrics == [], "Metrics must be empty per truth-vault-rule"
        assert len(project_obj.name) >= 1
        assert len(project_obj.description) >= 1
        validated_projects.append(project_obj)

    print(f"All {len(validated_projects)} imported projects strictly validated against Project schema.")

    # Print sample imported project JSON
    if data["projects"]:
        sample_project = data["projects"][0]
        print("\n--- SAMPLE IMPORTED PROJECT JSON ---")
        print(json.dumps(sample_project, indent=2))
        print("------------------------------------\n")

    # 2. Test Invalid/Non-existent GitHub user returns 404
    non_existent_user = "this-user-definitely-does-not-exist-999999"
    print(f"[TEST 2] GET /api/v1/vault/import/github/{non_existent_user}")
    not_found_resp = client.get(f"/api/v1/vault/import/github/{non_existent_user}")
    print(f"Status Code: {not_found_resp.status_code}")
    print(f"Response: {not_found_resp.json()}\n")
    assert not_found_resp.status_code == 404
    assert f"'{non_existent_user}' was not found" in not_found_resp.json()["detail"]

    # 3. Regression test: Existing POST /api/v1/vault/validate
    print(f"[TEST 3] Regression: POST /api/v1/vault/validate (sample_vault.json)")
    sample_vault_path = Path(__file__).parent / "sample_vault.json"
    with open(sample_vault_path, "r", encoding="utf-8") as f:
        sample_vault_data = json.load(f)

    validate_resp = client.post("/api/v1/vault/validate", json=sample_vault_data)
    print(f"Status Code: {validate_resp.status_code}")
    print(f"Response: {validate_resp.json()}\n")
    assert validate_resp.status_code == 200
    val_json = validate_resp.json()
    assert val_json["status"] == "valid"
    assert val_json["project_count"] == 3
    assert val_json["skill_count"] == 20

    # 4. Regression test: GET /health
    print(f"[TEST 4] Regression: GET /health")
    health_resp = client.get("/health")
    print(f"Status Code: {health_resp.status_code}")
    print(f"Response: {health_resp.json()}\n")
    assert health_resp.status_code == 200
    assert health_resp.json() == {"status": "ok", "service": "resume-builder-api"}

    print("=== ALL GITHUB IMPORT & REGRESSION TESTS PASSED ===")


if __name__ == "__main__":
    run_tests()
