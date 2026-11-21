"""Acceptance test suite for Micro-Task 12 (Step 6A):
Application Tracker, Callback Analytics, and Self-Learning Feedback Loop.
"""

import json
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.tracker import (
    ApplicationCreateRequest,
    ApplicationRecord,
    ApplicationStatusUpdateRequest,
    TrackerAnalyticsResponse,
)
from app.schemas.truth_vault import MasterTruthVault
from app.schemas.pipeline import DecodedJD
from app.schemas.skill_sprint import SkillGapSummary, WeekendMiniProject, TargetedInterviewQuestion
import app.agents.skill_sprint as skill_sprint_agent
from app.agents.skill_sprint import GeneratedSprintContent

client = TestClient(app)


def run_all_tests():
    print("=== Running Step 6A (Application Tracker & Analytics) Acceptance Tests ===\n")

    test_user_id = "tracker_test_user_42"
    app_data_file = Path(__file__).parent / "data" / "applications" / f"{test_user_id}.json"

    # Pre-clean test user data if left from previous runs
    if app_data_file.exists():
        app_data_file.unlink()

    try:
        # -------------------------------------------------------------
        # TEST 1: CRUD & Status Lifecycle
        # -------------------------------------------------------------
        print("[TEST 1] Application CRUD & Status Lifecycle:")

        # App 1: Internshala with metrics_heavy
        payload1 = {
            "user_id": test_user_id,
            "company_name": "Razorpay",
            "role_title": "Backend Engineering Intern",
            "detected_portal": "internshala",
            "source_url": "https://internshala.com/internship/detail/123",
            "ats_score": 92,
            "style_tag": "metrics_heavy",
            "selected_project_ids": ["indic-doc-chat", "chrono-queue"],
            "status": "applied",
            "notes": "Applied with custom screening answers.",
        }
        resp1 = client.post("/api/v1/tracker/applications", json=payload1)
        assert resp1.status_code == 201, f"Expected 201, got {resp1.status_code}: {resp1.text}"
        app1 = resp1.json()
        app1_id = app1["application_id"]
        print(f"  Created App 1: id={app1_id}, company={app1['company_name']}, status={app1['status']}")

        # App 2: Wellfound with concise_startup
        payload2 = {
            "user_id": test_user_id,
            "company_name": "Acme Startup (YC W24)",
            "role_title": "Software Engineer",
            "detected_portal": "wellfound",
            "source_url": "https://wellfound.com/jobs/456",
            "ats_score": 88,
            "style_tag": "concise_startup",
            "selected_project_ids": ["chrono-queue", "safepay-upi-detector"],
            "status": "applied",
            "notes": "Sent 3-line founder cold email.",
        }
        resp2 = client.post("/api/v1/tracker/applications", json=payload2)
        assert resp2.status_code == 201
        app2 = resp2.json()
        app2_id = app2["application_id"]
        print(f"  Created App 2: id={app2_id}, company={app2['company_name']}, status={app2['status']}")

        # App 3: LinkedIn with project_first
        payload3 = {
            "user_id": test_user_id,
            "company_name": "Enterprise Corp",
            "role_title": "Junior Python Developer",
            "detected_portal": "linkedin",
            "ats_score": 82,
            "style_tag": "project_first",
            "selected_project_ids": ["indic-doc-chat"],
            "status": "applied",
        }
        resp3 = client.post("/api/v1/tracker/applications", json=payload3)
        assert resp3.status_code == 201
        app3 = resp3.json()
        app3_id = app3["application_id"]
        print(f"  Created App 3: id={app3_id}, company={app3['company_name']}, status={app3['status']}")

        # List all applications
        list_resp = client.get(f"/api/v1/tracker/{test_user_id}/applications")
        assert list_resp.status_code == 200
        all_apps = list_resp.json()
        assert len(all_apps) == 3
        print(f"  Listed {len(all_apps)} applications successfully.")

        # Update App 1 status to shortlisted
        patch1 = client.patch(
            f"/api/v1/tracker/{test_user_id}/applications/{app1_id}",
            json={"status": "shortlisted", "notes": "Passed initial screening round."},
        )
        assert patch1.status_code == 200
        assert patch1.json()["status"] == "shortlisted"
        assert patch1.json()["notes"] == "Passed initial screening round."

        # Update App 2 status to interview
        patch2 = client.patch(
            f"/api/v1/tracker/{test_user_id}/applications/{app2_id}",
            json={"status": "interview", "notes": "Founder technical chat scheduled for Thursday."},
        )
        assert patch2.status_code == 200
        assert patch2.json()["status"] == "interview"

        # Filter by status="interview"
        interview_filter_resp = client.get(f"/api/v1/tracker/{test_user_id}/applications?status=interview")
        assert interview_filter_resp.status_code == 200
        assert len(interview_filter_resp.json()) == 1
        assert interview_filter_resp.json()[0]["application_id"] == app2_id

        print("  Test 1 passed successfully.\n")

        # -------------------------------------------------------------
        # TEST 2: Callback Analytics & Self-Learning Feedback Loop
        # -------------------------------------------------------------
        print("[TEST 2] Callback Analytics & Self-Learning Feedback Loop:")

        analytics_resp = client.get(f"/api/v1/tracker/{test_user_id}/analytics")
        assert analytics_resp.status_code == 200, f"Expected 200, got {analytics_resp.status_code}: {analytics_resp.text}"
        analytics = analytics_resp.json()

        print(f"  Total Applications: {analytics['total_applications']}")
        print(f"  Status Breakdown: {analytics['status_breakdown']}")
        print(f"  Portal Breakdown: {analytics['portal_breakdown']}")
        print(f"  Overall Callback Rate: {analytics['overall_callback_rate_pct']}%")
        print(f"  Average ATS Score: {analytics['avg_ats_score']}%")
        print(f"  Recommended Style: {analytics['recommended_style_tag']}")
        print(f"  Feedback Insights count: {len(analytics['feedback_insights'])}")
        for insight in analytics["feedback_insights"]:
            print(f"    - {insight}")

        # Assertions:
        # 3 total applications: 1 shortlisted, 1 interview, 1 applied
        # Positive callbacks: 2 out of 3 = 66.7%
        assert analytics["total_applications"] == 3
        assert analytics["overall_callback_rate_pct"] == 66.7
        assert analytics["status_breakdown"]["shortlisted"] == 1
        assert analytics["status_breakdown"]["interview"] == 1
        assert analytics["status_breakdown"]["applied"] == 1
        assert analytics["recommended_style_tag"] in ["metrics_heavy", "concise_startup"]
        assert len(analytics["feedback_insights"]) >= 2
        # Verify that top projects (chrono-queue, indic-doc-chat) are referenced in feedback insights
        assert any("chrono-queue" in insight.lower() or "indic-doc-chat" in insight.lower() for insight in analytics["feedback_insights"])

        print("  Test 2 passed successfully.\n")

        # -------------------------------------------------------------
        # TEST 3: Security & 404 Error Handling
        # -------------------------------------------------------------
        print("[TEST 3] Security & 404 Error Handling:")

        # Path traversal rejection
        bad_id_resp = client.get("/api/v1/tracker/../../etc/passwd/applications")
        assert bad_id_resp.status_code in [400, 404]

        # Unknown application ID returns 404
        not_found_resp = client.get(f"/api/v1/tracker/{test_user_id}/applications/non-existent-app-id")
        assert not_found_resp.status_code == 404
        assert "not found" in not_found_resp.json()["detail"].lower()

        patch_not_found = client.patch(
            f"/api/v1/tracker/{test_user_id}/applications/non-existent-app-id",
            json={"status": "interview"},
        )
        assert patch_not_found.status_code == 404

        print("  Test 3 passed successfully.\n")

        # -------------------------------------------------------------
        # TEST 4: System Regression Checks
        # -------------------------------------------------------------
        print("[TEST 4] System Regression Checks:")

        # 4A: /health
        health_resp = client.get("/health")
        assert health_resp.status_code == 200
        assert health_resp.json()["status"] == "ok"
        print("  /health passed.")

        # 4B: /api/v1/vault/validate
        sample_vault_path = Path(__file__).parent / "sample_vault.json"
        with open(sample_vault_path, "r", encoding="utf-8") as f:
            vault_data = json.load(f)
        vault_val_resp = client.post("/api/v1/vault/validate", json=vault_data)
        assert vault_val_resp.status_code == 200
        assert vault_val_resp.json()["status"] == "valid"
        print("  /api/v1/vault/validate passed.")

        # 4C: /api/v1/skill-sprint/generate
        def mock_sprint(request, gap):
            return GeneratedSprintContent(
                mini_project=WeekendMiniProject(
                    title="Mock Sprint",
                    target_skills=["Go"],
                    problem_statement="Test statement",
                    tech_stack=["Go"],
                    day_1_milestones=["Step 1", "Step 2"],
                    day_2_milestones=["Step 3", "Step 4"],
                    post_completion_resume_bullet_template="Built mock sprint.",
                ),
                interview_questions=[
                    TargetedInterviewQuestion(
                        question=f"Question {i}",
                        category="technical" if i < 4 else ("system_design" if i < 6 else ("project_deep_dive" if i < 8 else "behavioral")),
                        why_asked="Why",
                        crisp_answer_guide="Answer",
                    )
                    for i in range(10)
                ],
            )

        skill_sprint_agent.default_llm_override = mock_sprint
        sprint_resp = client.post(
            "/api/v1/skill-sprint/generate",
            json={
                "vault": vault_data,
                "decoded_jd": {
                    "role_title": "Backend Intern",
                    "must_have_skills": ["Python"],
                },
            },
        )
        assert sprint_resp.status_code == 200
        assert len(sprint_resp.json()["interview_questions"]) == 10
        print("  /api/v1/skill-sprint/generate passed.")

        print("\n=== ALL STEP 6A APPLICATION TRACKER & ANALYTICS TESTS PASSED SUCCESSFULLY ===")

    finally:
        skill_sprint_agent.default_llm_override = None
        if app_data_file.exists():
            app_data_file.unlink()
            print(f"[CLEANUP] Removed test tracker file: {app_data_file}")


if __name__ == "__main__":
    run_all_tests()
