"""Acceptance tests for Vault Store persistence, sync-github, and regression checks."""

import json
from pathlib import Path
import shutil
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.truth_vault import MasterTruthVault

client = TestClient(app)

TEST_USER_ID = "test_user_001"
DATA_DIR = Path(__file__).resolve().parent / "data" / "vaults"
TEST_VAULT_FILE = DATA_DIR / f"{TEST_USER_ID}.json"


def cleanup_test_file():
    """Ensure test vault file is removed."""
    if TEST_VAULT_FILE.exists():
        try:
            TEST_VAULT_FILE.unlink()
        except Exception as e:
            print(f"Warning during cleanup: {e}")


def run_tests():
    print("=== Running Vault Store Persistence & Sync Acceptance Tests ===\n")
    cleanup_test_file()

    try:
        # Load sample vault
        sample_vault_path = Path(__file__).parent / "sample_vault.json"
        with open(sample_vault_path, "r", encoding="utf-8") as f:
            sample_vault_data = json.load(f)

        # 1. PUT /api/v1/vault/test_user_001 (Save vault)
        print(f"[TEST 1] PUT /api/v1/vault/{TEST_USER_ID}")
        put_resp = client.put(f"/api/v1/vault/{TEST_USER_ID}", json=sample_vault_data)
        print(f"Status Code: {put_resp.status_code}")
        assert put_resp.status_code == 200, f"PUT failed: {put_resp.text}"
        put_data = put_resp.json()
        assert put_data["status"] == "saved"
        assert put_data["user_id"] == TEST_USER_ID
        assert put_data["project_count"] == 3
        assert TEST_VAULT_FILE.exists(), f"Expected {TEST_VAULT_FILE} to exist on disk."
        print(f"Vault successfully written to disk: {TEST_VAULT_FILE}\n")

        # 2. GET /api/v1/vault/test_user_001 (Retrieve saved vault)
        print(f"[TEST 2] GET /api/v1/vault/{TEST_USER_ID}")
        get_resp = client.get(f"/api/v1/vault/{TEST_USER_ID}")
        print(f"Status Code: {get_resp.status_code}")
        assert get_resp.status_code == 200, f"GET failed: {get_resp.text}"
        retrieved_vault = MasterTruthVault.model_validate(get_resp.json())
        assert retrieved_vault.basics.full_name == sample_vault_data["basics"]["full_name"]
        assert len(retrieved_vault.projects) == 3
        assert retrieved_vault.projects[0].metrics == sample_vault_data["projects"][0]["metrics"]
        print(f"Successfully retrieved exact matching vault for {TEST_USER_ID}.\n")

        # 3. POST /api/v1/vault/test_user_001/sync-github/tiangolo?max_repos=2 (Merge 2 projects)
        print(f"[TEST 3] POST /api/v1/vault/{TEST_USER_ID}/sync-github/tiangolo?max_repos=2")
        sync_resp_1 = client.post(f"/api/v1/vault/{TEST_USER_ID}/sync-github/tiangolo?max_repos=2")
        print(f"Status Code: {sync_resp_1.status_code}")
        assert sync_resp_1.status_code == 200, f"Sync 1 failed: {sync_resp_1.text}"
        sync_data_1 = sync_resp_1.json()
        print(f"Sync 1 Result: {sync_data_1}")
        assert sync_data_1["status"] == "synced"
        assert sync_data_1["newly_added_count"] == 2
        assert sync_data_1["total_projects"] == 5
        print(f"Total projects increased from 3 to 5 (added {sync_data_1['newly_added_count']}).\n")

        # 4. POST /api/v1/vault/test_user_001/sync-github/tiangolo?max_repos=2 (Deduplication check)
        print(f"[TEST 4] POST /api/v1/vault/{TEST_USER_ID}/sync-github/tiangolo?max_repos=2 (Second Sync - Deduplication)")
        sync_resp_2 = client.post(f"/api/v1/vault/{TEST_USER_ID}/sync-github/tiangolo?max_repos=2")
        print(f"Status Code: {sync_resp_2.status_code}")
        assert sync_resp_2.status_code == 200, f"Sync 2 failed: {sync_resp_2.text}"
        sync_data_2 = sync_resp_2.json()
        print(f"Sync 2 Result: {sync_data_2}")
        assert sync_data_2["status"] == "synced"
        assert sync_data_2["newly_added_count"] == 0, "Duplicate projects must not be added"
        assert sync_data_2["total_projects"] == 5
        print(f"Deduplication confirmed: 0 projects added, total remains 5.\n")

        # 5. Path traversal protection check
        print(f"[TEST 5] Path Traversal Security Check (Invalid user_id)")
        bad_resp = client.get("/api/v1/vault/..%2F..%2Fetc%2Fpasswd")
        print(f"Status Code: {bad_resp.status_code}")
        assert bad_resp.status_code in [400, 404]

        invalid_id_resp = client.get("/api/v1/vault/user@invalid$id")
        print(f"Invalid characters Status Code: {invalid_id_resp.status_code}")
        assert invalid_id_resp.status_code == 400
        print("Path safety validation passed.\n")

        # 6. Non-existent user check
        print(f"[TEST 6] GET /api/v1/vault/non_existent_user_99999")
        not_found_resp = client.get("/api/v1/vault/non_existent_user_99999")
        print(f"Status Code: {not_found_resp.status_code}")
        assert not_found_resp.status_code == 404
        print("Non-existent user returned 404 as expected.\n")

        # 7. Regression checks
        print(f"[TEST 7] Regression Check: /health and /api/v1/vault/validate")
        health_resp = client.get("/health")
        assert health_resp.status_code == 200
        assert health_resp.json() == {"status": "ok", "service": "resume-builder-api"}

        validate_resp = client.post("/api/v1/vault/validate", json=sample_vault_data)
        assert validate_resp.status_code == 200
        assert validate_resp.json()["status"] == "valid"
        print("All regression checks passed.\n")

        print("=== ALL VAULT STORE & SYNC TESTS COMPLETED SUCCESSFULLY ===")

    finally:
        cleanup_test_file()
        print(f"[CLEANUP] Removed test vault file: {TEST_VAULT_FILE}")


if __name__ == "__main__":
    run_tests()
