"""Acceptance tests for Agent 2 (Resume Architect) and vault grounding verification."""

import json
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.agents import resume_architect, jd_decoder
from app.agents.resume_architect import sanitize_ats_text, verify_vault_grounding
from app.schemas.pipeline import (
    DecodedJD,
    EligibilityConstraints,
    TailoredExperience,
    TailoredProject,
    TailoredResume,
    TailoredSkillGroup,
)
from app.schemas.truth_vault import MasterTruthVault

client = TestClient(app)


def run_tests():
    print("=== Running Agent 2 (Resume Architect) Acceptance Tests ===\n")

    # 1. Unit Test for sanitize_ats_text
    print("[TEST 1] Testing ATS Text Sanitization:")
    dirty_text = "🚀 Boosted backend throughput by 45% using **Go microservices** --- eliminated 🚨 crashes!"
    cleaned = sanitize_ats_text(dirty_text)
    print(f"  Input:  {dirty_text}")
    print(f"  Clean:  {cleaned}")
    assert "🚀" not in cleaned, "Emoji rocket must be removed"
    assert "🚨" not in cleaned, "Emoji siren must be removed"
    assert "**" not in cleaned, "Markdown bold must be removed"
    assert "---" not in cleaned, "Markdown divider must be removed"
    assert "Boosted backend throughput by 45% using Go microservices eliminated crashes!" == cleaned
    print("ATS text sanitization test passed.\n")

    # Load sample vault
    sample_vault_path = Path(__file__).parent / "sample_vault.json"
    with open(sample_vault_path, "r", encoding="utf-8") as f:
        sample_vault_data = json.load(f)
    vault = MasterTruthVault.model_validate(sample_vault_data)

    realistic_decoded_jd = DecodedJD(
        role_title="Backend Engineering Intern",
        company_name="Razorpay Software Private Limited",
        role_level="intern",
        company_vibe="startup",
        detected_portal="internshala",
        must_have_skills=["Go", "Python", "PostgreSQL", "Redis"],
        nice_to_have_skills=["Docker", "Kafka", "gRPC"],
        ats_keywords=["Microservices", "PostgreSQL", "Redis", "Distributed Systems"],
        key_responsibilities=["Develop Go microservices", "Maintain high test coverage"],
        eligibility_constraints=EligibilityConstraints(min_cgpa=7.5, graduation_years=[2025])
    )

    # 2. Test Tailored Resume Generation with Mock LLM
    mock_valid_tailored = TailoredResume(
        target_role="Backend Engineering Intern",
        professional_summary="Computer Science undergraduate with verified expertise in Go and Python distributed backend microservices.",
        selected_project_ids=["distributed-task-queue", "indic-doc-chat"],
        experience=[
            TailoredExperience(
                company="Razorpay",
                role="Software Engineering Intern",
                location="Bengaluru, India",
                start_date="2024-05",
                end_date="2024-07",
                bullets=[
                    "Engineered idempotency middleware in Go processing 25,000+ daily events.",
                    "Reduced duplicate retries by 42% through distributed Redis lock keying."
                ]
            )
        ],
        projects=[
            TailoredProject(
                source_project_id="distributed-task-queue",
                name="ChronoQueue - Distributed Fault-Tolerant Task Orchestrator",
                tech_stack=["Go", "gRPC", "Protobuf", "Redis", "Docker"],
                repo_url="https://github.com/aaravsharma-dev/chrono-queue",
                live_url="https://chrono-queue.demo.aaravsharma.dev",
                bullets=[
                    "Architected high-throughput task queue processing 15,000+ jobs/sec on a 3-node cluster.",
                    "Designed raft-based leader election achieving zero data loss under abrupt worker shutdowns."
                ]
            ),
            TailoredProject(
                source_project_id="indic-doc-chat",
                name="IndicDoc - Multilingual RAG Document Assistant",
                tech_stack=["Python", "FastAPI", "ChromaDB", "Gemini API"],
                repo_url="https://github.com/aaravsharma-dev/indic-doc-chat",
                live_url="https://indic-doc-chat.vercel.app",
                bullets=[
                    "Engineered multilingual retrieval pipeline indexing 1,200+ enterprise PDFs with sub-850ms latency.",
                    "Reduced citation hallucinations by 38% via hybrid BM25 and multilingual vector search."
                ]
            )
        ],
        skills=[
            TailoredSkillGroup(category_name="Languages", skills=["Go", "Python", "SQL"]),
            TailoredSkillGroup(category_name="Databases & Caching", skills=["PostgreSQL", "Redis", "ChromaDB"])
        ],
        matched_ats_keywords=["Go", "Python", "PostgreSQL", "Redis", "Distributed Systems"]
    )

    # Configure mock override
    resume_architect.default_llm_override = mock_valid_tailored

    try:
        print("[TEST 2] POST /api/v1/pipeline/tailor-resume (Valid Grounded Vault)")
        payload = {
            "vault": sample_vault_data,
            "decoded_jd": realistic_decoded_jd.model_dump(),
            "critic_feedback": []
        }
        resp = client.post("/api/v1/pipeline/tailor-resume", json=payload)
        print(f"Status Code: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["target_role"] == "Backend Engineering Intern"
        assert len(data["selected_project_ids"]) == 2
        assert len(data["projects"]) == 2
        assert data["projects"][0]["source_project_id"] == "distributed-task-queue"
        print("Tailored resume response successfully validated against TailoredResume schema.\n")

        # 3. Test Hallucinated Project ID Grounding Failure (422)
        print("[TEST 3] Testing Grounding Guardrail Rejection on Hallucinated Project ID:")
        mock_hallucinated = mock_valid_tailored.model_copy(deep=True)
        # Inject fabricated project ID not in sample_vault.json
        mock_hallucinated.selected_project_ids.append("fabricated-ai-blockchain-bot")
        resume_architect.default_llm_override = mock_hallucinated

        bad_resp = client.post("/api/v1/pipeline/tailor-resume", json=payload)
        print(f"Status Code: {bad_resp.status_code}")
        print(f"Error Detail: {bad_resp.json().get('detail')}")
        assert bad_resp.status_code == 422
        assert "Grounding violation" in bad_resp.json()["detail"]
        assert "fabricated-ai-blockchain-bot" in bad_resp.json()["detail"]
        print("Hallucinated project ID caught and rejected with HTTP 422.\n")

        # 4. Regression tests
        print("[TEST 4] Regression Checks: /health, /api/v1/vault/validate, and /api/v1/pipeline/decode-jd")
        health_resp = client.get("/health")
        assert health_resp.status_code == 200
        assert health_resp.json()["status"] == "ok"

        val_resp = client.post("/api/v1/vault/validate", json=sample_vault_data)
        assert val_resp.status_code == 200
        assert val_resp.json()["status"] == "valid"

        # Mock JD decoder override for regression check
        jd_decoder.default_llm_override = realistic_decoded_jd
        decode_resp = client.post("/api/v1/pipeline/decode-jd", json={
            "raw_jd_text": "We are hiring a backend engineering intern with Go and Python experience at Razorpay Bangalore."
        })
        assert decode_resp.status_code == 200
        assert decode_resp.json()["role_title"] == "Backend Engineering Intern"
        print("All regression checks passed successfully.\n")

        # 5. Test Non-JD Skill Exclusion for Accounts Officer JD
        print("[TEST 5] Testing Non-JD Skill Exclusion for Accounts Officer JD:")
        accounts_jd = DecodedJD(
            role_title="Accounts Officer",
            company_name="Finance Corp",
            role_level="mid",
            company_vibe="corporate",
            detected_portal="custom",
            must_have_skills=["Tally ERP", "GST", "TDS", "MS Office"],
            nice_to_have_skills=["Auditing"],
            ats_keywords=["Taxation", "Financial Accounting"],
            key_responsibilities=["Maintain accounts", "File GST returns"],
            eligibility_constraints=EligibilityConstraints()
        )
        # Mock architect returning tech skills alongside one matching skill
        mock_accounts_tailored = mock_valid_tailored.model_copy(deep=True)
        mock_accounts_tailored.matched_ats_keywords = ["Python", "SQL", "PostgreSQL", "Redis", "MS Office"]
        resume_architect.default_llm_override = mock_accounts_tailored

        acct_payload = {
            "vault": sample_vault_data,
            "decoded_jd": accounts_jd.model_dump(),
            "critic_feedback": []
        }
        acct_resp = client.post("/api/v1/pipeline/tailor-resume", json=acct_payload)
        assert acct_resp.status_code == 200
        acct_data = acct_resp.json()
        print(f"  Returned matched_ats_keywords: {acct_data['matched_ats_keywords']}")
        for non_jd_skill in ["Python", "SQL", "PostgreSQL", "Redis"]:
            assert non_jd_skill not in acct_data["matched_ats_keywords"], f"False positive: {non_jd_skill} should not be in matched_ats_keywords"
        assert "MS Office" in acct_data["matched_ats_keywords"]
        print("Non-JD skills strictly excluded from matched_ats_keywords.\n")

        print("=== ALL AGENT 2 (RESUME ARCHITECT) TESTS PASSED SUCCESSFULLY ===")

    finally:
        resume_architect.default_llm_override = None
        jd_decoder.default_llm_override = None


if __name__ == "__main__":
    run_tests()
