"""Automated acceptance tests for Master Truth Vault validation."""

import json
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def run_acceptance_tests():
    print("=== Running Multi-Agent Resume Builder Acceptance Tests ===\n")

    # 1. Health check test
    health_resp = client.get("/health")
    print(f"[TEST 1] GET /health")
    print(f"Status Code: {health_resp.status_code}")
    print(f"Response: {health_resp.json()}\n")
    assert health_resp.status_code == 200
    assert health_resp.json() == {"status": "ok", "service": "resume-builder-api"}

    # 2. Sample vault validation test
    sample_vault_path = Path(__file__).parent / "sample_vault.json"
    with open(sample_vault_path, "r", encoding="utf-8") as f:
        sample_vault_data = json.load(f)

    validate_resp = client.post("/api/v1/vault/validate", json=sample_vault_data)
    print(f"[TEST 2] POST /api/v1/vault/validate (Valid Sample Vault)")
    print(f"Status Code: {validate_resp.status_code}")
    print(f"Response: {validate_resp.json()}\n")
    assert validate_resp.status_code == 200
    res_json = validate_resp.json()
    assert res_json["status"] == "valid"
    assert res_json["project_count"] == 3
    assert res_json["skill_count"] == 20  # 5 + 5 + 4 + 6 = 20

    # 3. Invalid email test (Expect HTTP 422)
    invalid_vault_data = json.loads(json.dumps(sample_vault_data))
    invalid_vault_data["basics"]["email"] = "not-a-valid-email-address"

    invalid_resp = client.post("/api/v1/vault/validate", json=invalid_vault_data)
    print(f"[TEST 3] POST /api/v1/vault/validate (Invalid Email Test)")
    print(f"Status Code: {invalid_resp.status_code}")
    print(f"Response: {invalid_resp.json()}\n")
    assert invalid_resp.status_code == 422
    assert "detail" in invalid_resp.json()

    print("=== ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY ===")


if __name__ == "__main__":
    run_acceptance_tests()
