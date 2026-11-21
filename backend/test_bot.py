"""Acceptance test suite for Micro-Task 13 (Step 6B):
Vision JD Screenshot Extractor and WhatsApp / Telegram Bot Webhook.
"""

import base64
import json
import os
from pathlib import Path
from fastapi.testclient import TestClient
import pypdf
import io

from app.main import app
from app.schemas.bot import (
    BotIncomingMessage,
    BotReplyResponse,
    VisionExtractResponse,
)
from app.schemas.truth_vault import MasterTruthVault
from app.schemas.pipeline import (
    ATSCritique,
    DecodedJD,
    TailoredExperience,
    TailoredProject,
    TailoredResume,
    TailoredSkillGroup,
)
from app.services.vault_store import get_vault_store
import app.agents.vision_jd as vision_agent
import app.agents.jd_decoder as decoder_agent
import app.agents.resume_architect as architect_agent
import app.agents.ats_critic as critic_agent

client = TestClient(app)

# 1x1 valid PNG transparent pixel base64 string
SAMPLE_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="


def mock_vision(clean_b64, mime):
    return VisionExtractResponse(
        extracted_jd_text=(
            "Senior Backend Engineer at Razorpay. Requirements: Go, Python, PostgreSQL, Redis, REST APIs. "
            "Experience with high-throughput distributed systems and payment processing architectures."
        ),
        detected_company="Razorpay",
        detected_role="Senior Backend Engineer",
        char_count=192,
    )


def mock_decoder(text, url):
    return DecodedJD(
        role_title="Senior Backend Engineer",
        company_name="Razorpay",
        must_have_skills=["Go", "Python", "PostgreSQL", "Redis"],
        nice_to_have_skills=["Docker", "Kafka"],
        ats_keywords=["REST APIs", "distributed systems", "payment processing"],
        detected_portal="whatsapp" if "whatsapp" in str(url or "").lower() else "unknown",
    )


def mock_architect(vault, jd, feedback):
    return TailoredResume(
        target_role="Senior Backend Engineer",
        professional_summary="Backend engineer with verified experience in Go and Python microservices.",
        selected_project_ids=["indic-doc-chat", "distributed-task-queue"],
        experience=[
            TailoredExperience(
                company="Razorpay",
                role="Software Engineering Intern",
                location="Bengaluru, India",
                start_date="2024-05",
                end_date="2024-07",
                bullets=[
                    "Engineered idempotency middleware in Go for merchant webhook dispatches, processing 25,000+ daily events.",
                    "Reduced duplicate event retries by 42% through distributed Redis lock keying.",
                ],
            )
        ],
        projects=[
            TailoredProject(
                source_project_id="distributed-task-queue",
                name="ChronoQueue",
                tech_stack=["Go", "Redis", "Docker"],
                bullets=[
                    "Architected high-throughput distributed task scheduler processing 15,000+ jobs/sec on a 3-node cluster.",
                    "Designed raft-based leader election achieving zero data loss under abrupt node crashes.",
                ],
            )
        ],
        skills=[
            TailoredSkillGroup(
                category_name="Languages & Caching",
                skills=["Go", "Python", "Redis", "PostgreSQL"],
            )
        ],
        matched_ats_keywords=["REST APIs", "distributed systems"],
    )


def mock_critic(vault, jd, tailored):
    return ATSCritique(
        score=92,
        passed=True,
        matched_keywords=["Go", "Python", "Redis", "PostgreSQL"],
        missing_must_have_skills=[],
        missing_ats_keywords=[],
        actionable_feedback=[],
        hallucination_flags=[],
    )


def run_all_tests():
    print("=== Running Step 6B (Vision JD & Bot Webhook) Acceptance Tests ===\n")

    test_user_id = "bot_test_user_99"
    store = get_vault_store()

    # Load baseline test vault and save under test_user_id
    sample_vault_path = Path(__file__).parent / "sample_vault.json"
    with open(sample_vault_path, "r", encoding="utf-8") as f:
        vault_data = json.load(f)
    vault = MasterTruthVault.model_validate(vault_data)
    store.save_vault(test_user_id, vault)

    # Attach deterministic overrides
    vision_agent.default_llm_override = mock_vision
    decoder_agent.default_llm_override = mock_decoder
    architect_agent.default_llm_override = mock_architect
    critic_agent.default_llm_override = mock_critic

    try:
        # -------------------------------------------------------------
        # TEST 1: Vision Screenshot Flow (WhatsApp)
        # -------------------------------------------------------------
        print("[TEST 1] Vision Screenshot Webhook Flow (WhatsApp):")
        payload_vision = {
            "channel": "whatsapp",
            "user_id": test_user_id,
            "chat_id": "+919876543210",
            "image_base64": SAMPLE_PNG_BASE64,
            "image_mime_type": "image/png",
            "source_url": "https://whatsapp.com/job-post",
        }

        resp_vision = client.post("/api/v1/bot/webhook", json=payload_vision)
        assert resp_vision.status_code == 200, f"Expected 200, got {resp_vision.status_code}: {resp_vision.text}"
        data_vision = resp_vision.json()

        print(f"  Channel: {data_vision['channel']}")
        print(f"  Status: {data_vision['status']}")
        print(f"  ATS Score: {data_vision['ats_score']}/100")
        print(f"  PDF Filename: {data_vision['pdf_filename']}")
        print(f"  PDF Verified: {data_vision['pdf_verified']}")

        assert data_vision["status"] == "success"
        assert data_vision["ats_score"] == 92
        assert data_vision["pdf_verified"] is True
        assert data_vision["pdf_base64"] is not None

        # Verify decoded PDF bytes
        pdf_bytes = base64.b64decode(data_vision["pdf_base64"])
        assert pdf_bytes.startswith(b"%PDF-"), "Generated attachment must be valid PDF"
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        assert len(reader.pages) >= 1
        extracted_text = reader.pages[0].extract_text()
        assert "Aarav Sharma" in extracted_text
        print(f"  Extracted {len(extracted_text)} chars from returned PDF attachment.")
        print("  Test 1 passed successfully.\n")

        # -------------------------------------------------------------
        # TEST 2: Text JD Flow (Telegram)
        # -------------------------------------------------------------
        print("[TEST 2] Text JD Webhook Flow (Telegram):")
        payload_text = {
            "channel": "telegram",
            "user_id": test_user_id,
            "chat_id": "tg_user_12345",
            "message_text": (
                "Senior Backend Engineer at Razorpay. Requirements: Go, Python, PostgreSQL, Redis, REST APIs. "
                "Experience with high-throughput distributed systems and payment processing architectures."
            ),
        }

        resp_text = client.post("/api/v1/bot/webhook", json=payload_text)
        assert resp_text.status_code == 200, f"Expected 200, got {resp_text.status_code}: {resp_text.text}"
        data_text = resp_text.json()

        print(f"  Channel: {data_text['channel']}")
        print(f"  Status: {data_text['status']}")
        print(f"  ATS Score: {data_text['ats_score']}/100")
        print(f"  Reply preview:\n{data_text['reply_text']}")

        assert data_text["status"] == "success"
        assert data_text["ats_score"] == 92
        assert data_text["pdf_verified"] is True
        assert "ATS Resume Tailored Successfully" in data_text["reply_text"]
        print("  Test 2 passed successfully.\n")

        # -------------------------------------------------------------
        # TEST 3: Edge Cases & Security
        # -------------------------------------------------------------
        print("[TEST 3] Edge Cases & Security Verification:")

        # 3A: Missing User Vault
        missing_vault_resp = client.post(
            "/api/v1/bot/webhook",
            json={
                "channel": "telegram",
                "user_id": "non_existent_candidate",
                "chat_id": "tg_999",
                "message_text": "Looking for Go and Python developer with 3 years experience in distributed systems.",
            },
        )
        assert missing_vault_resp.status_code == 200
        assert missing_vault_resp.json()["status"] == "vault_not_found"
        assert "couldn't find a Master Truth Vault" in missing_vault_resp.json()["reply_text"]
        print("  3A: Missing vault handled cleanly.")

        # 3B: Short Message (< 50 chars)
        short_msg_resp = client.post(
            "/api/v1/bot/webhook",
            json={
                "channel": "whatsapp",
                "user_id": test_user_id,
                "chat_id": "wa_999",
                "message_text": "Hi, make resume.",
            },
        )
        assert short_msg_resp.status_code == 200
        assert short_msg_resp.json()["status"] == "needs_more_info"
        assert "too short" in short_msg_resp.json()["reply_text"].lower()
        print("  3B: Short message handled cleanly.")

        # 3C: Invalid Base64 in vision endpoint
        invalid_b64_resp = client.post(
            "/api/v1/bot/extract-jd-image",
            json={
                "image_base64": "not-valid-base64-content!@#$%",
                "image_mime_type": "image/png",
            },
        )
        assert invalid_b64_resp.status_code == 400
        print("  3C: Invalid base64 rejected with HTTP 400.")

        # 3D: Webhook Secret Authentication
        os.environ["BOT_WEBHOOK_SECRET"] = "secret_webhook_pass_2026"
        try:
            # Unauthorized call without header
            unauth_resp = client.post("/api/v1/bot/webhook", json=payload_text)
            assert unauth_resp.status_code == 401
            print("  3D: Missing webhook secret rejected with HTTP 401.")

            # Unauthorized call with incorrect secret
            bad_secret_resp = client.post(
                "/api/v1/bot/webhook",
                json=payload_text,
                headers={"X-Bot-Webhook-Secret": "wrong_secret"},
            )
            assert bad_secret_resp.status_code == 401
            print("  3D: Wrong webhook secret rejected with HTTP 401.")

            # Authorized call with valid secret
            auth_resp = client.post(
                "/api/v1/bot/webhook",
                json=payload_text,
                headers={"X-Bot-Webhook-Secret": "secret_webhook_pass_2026"},
            )
            assert auth_resp.status_code == 200
            print("  3D: Correct webhook secret accepted with HTTP 200.")
        finally:
            del os.environ["BOT_WEBHOOK_SECRET"]

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
        vault_val_resp = client.post("/api/v1/vault/validate", json=vault_data)
        assert vault_val_resp.status_code == 200
        assert vault_val_resp.json()["status"] == "valid"
        print("  /api/v1/vault/validate passed.")

        # 4C: /api/v1/tracker/{user_id}/analytics
        analytics_resp = client.get(f"/api/v1/tracker/{test_user_id}/analytics")
        assert analytics_resp.status_code == 200
        assert analytics_resp.json()["user_id"] == test_user_id
        print("  /api/v1/tracker/{user_id}/analytics passed.")

        print("\n=== ALL STEP 6B VISION JD & BOT WEBHOOK TESTS PASSED SUCCESSFULLY ===")

    finally:
        # Reset overrides
        vision_agent.default_llm_override = None
        decoder_agent.default_llm_override = None
        architect_agent.default_llm_override = None
        critic_agent.default_llm_override = None

        # Clean up test user vault
        test_vault_file = Path(__file__).parent / "data" / "vaults" / f"{test_user_id}.json"
        if test_vault_file.exists():
            test_vault_file.unlink()
            print(f"[CLEANUP] Removed test vault file: {test_vault_file}")


if __name__ == "__main__":
    run_all_tests()
