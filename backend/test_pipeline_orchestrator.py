"""Acceptance tests for Agent 3 (ATS Critic) and LangGraph Pipeline Orchestrator."""

import json
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.agents.ats_critic import evaluate_ats_deterministic
from app.agents import jd_decoder, resume_architect, ats_critic
from app.agents.orchestrator import run_resume_pipeline
from app.schemas.pipeline import (
    ATSCritique,
    DecodedJD,
    EligibilityConstraints,
    TailoredExperience,
    TailoredProject,
    TailoredResume,
    TailoredSkillGroup,
)
from app.schemas.truth_vault import MasterTruthVault

client = TestClient(app)


def build_test_fixtures():
    sample_vault_path = Path(__file__).parent / "sample_vault.json"
    with open(sample_vault_path, "r", encoding="utf-8") as f:
        sample_vault_data = json.load(f)
    vault = MasterTruthVault.model_validate(sample_vault_data)

    decoded_jd = DecodedJD(
        role_title="Backend Engineering Intern",
        company_name="Razorpay Software Private Limited",
        role_level="intern",
        company_vibe="startup",
        detected_portal="internshala",
        must_have_skills=["Go", "Python", "PostgreSQL", "Redis"],
        nice_to_have_skills=["Docker", "Kafka", "gRPC"],
        ats_keywords=["Microservices", "PostgreSQL", "Redis", "Distributed Systems"],
        key_responsibilities=["Build Go microservices", "Maintain high test coverage"],
        eligibility_constraints=EligibilityConstraints(min_cgpa=7.5, graduation_years=[2025]),
    )

    tailored_resume = TailoredResume(
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
                    "Reduced duplicate retries by 42% through distributed Redis lock keying.",
                ],
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
                    "Designed raft-based leader election achieving zero data loss under abrupt worker shutdowns.",
                ],
            ),
            TailoredProject(
                source_project_id="indic-doc-chat",
                name="IndicDoc - Multilingual RAG Document Assistant",
                tech_stack=["Python", "FastAPI", "ChromaDB", "Gemini API"],
                repo_url="https://github.com/aaravsharma-dev/indic-doc-chat",
                live_url="https://indic-doc-chat.vercel.app",
                bullets=[
                    "Engineered multilingual retrieval pipeline indexing 1,200+ enterprise PDFs with sub-850ms latency.",
                    "Reduced citation hallucinations by 38% via hybrid BM25 and multilingual vector search.",
                ],
            ),
        ],
        skills=[
            TailoredSkillGroup(category_name="Languages", skills=["Go", "Python", "SQL"]),
            TailoredSkillGroup(category_name="Databases & Caching", skills=["PostgreSQL", "Redis", "ChromaDB"]),
        ],
        matched_ats_keywords=["Go", "Python", "PostgreSQL", "Redis", "Distributed Systems"],
    )

    return vault, decoded_jd, tailored_resume


def run_tests():
    print("=== Running Step 2 Multi-Agent Orchestrator Acceptance Tests ===\n")
    vault, decoded_jd, tailored_resume = build_test_fixtures()

    # TEST 4: Direct test of evaluate_ats_deterministic
    print("[TEST 4] Direct Deterministic ATS Critic Check:")
    critique = evaluate_ats_deterministic(vault, decoded_jd, tailored_resume)
    print(f"  Score: {critique.score}")
    print(f"  Passed: {critique.passed}")
    print(f"  Matched Keywords: {critique.matched_keywords}")
    print(f"  Missing Must-Have: {critique.missing_must_have_skills}")
    print(f"  Hallucination Flags: {critique.hallucination_flags}")
    assert critique.score >= 85, f"Expected >= 85, got {critique.score}"
    assert critique.passed is True
    assert len(critique.hallucination_flags) == 0
    print("Deterministic ATS critic successfully scored resume without hallucination pressure.\n")

    # TEST 1: First-Pass Success (Critic returns score 92 on attempt 1 -> attempts == 1, status == 'passed')
    print("[TEST 1] Testing First-Pass Success in Orchestrator:")
    pass_critique = ATSCritique(
        score=92,
        passed=True,
        matched_keywords=["Go", "Python", "PostgreSQL", "Redis"],
        missing_must_have_skills=[],
        missing_ats_keywords=[],
        actionable_feedback=[],
        hallucination_flags=[],
    )

    jd_decoder.default_llm_override = decoded_jd
    resume_architect.default_llm_override = tailored_resume
    ats_critic.default_llm_override = pass_critique

    try:
        resp1 = client.post(
            "/api/v1/pipeline/run",
            json={
                "vault": vault.model_dump(mode="json"),
                "raw_jd_text": "We are hiring a backend engineering intern with Go and Python experience at Razorpay Bangalore.",
            },
        )
        assert resp1.status_code == 200, f"Expected 200, got {resp1.status_code}: {resp1.text}"
        data1 = resp1.json()
        print(f"  Attempts: {data1['attempts']} | Status: {data1['status']} | ATS Score: {data1['ats_critique']['score']}")
        assert data1["attempts"] == 1
        assert data1["status"] == "passed"
        assert data1["ats_critique"]["score"] == 92
        print("First-pass test passed.\n")
    finally:
        ats_critic.default_llm_override = None

    # TEST 2: Retry Loop Recovery
    # Attempt 1 -> score 72 with feedback. Attempt 2 -> score 90.
    print("[TEST 2] Testing Retry Loop Recovery (Score 72 -> Score 90 on Retry 1):")
    call_count = {"critic": 0, "architect": 0}

    def dynamic_architect(v, jd, feedback):
        call_count["architect"] += 1
        if feedback:
            assert "Add verified Kafka skill" in feedback[0]
        return tailored_resume

    def dynamic_critic(v, jd, t):
        call_count["critic"] += 1
        if call_count["critic"] == 1:
            return ATSCritique(
                score=72,
                passed=False,
                matched_keywords=["Go", "Python"],
                missing_must_have_skills=["PostgreSQL"],
                missing_ats_keywords=[],
                actionable_feedback=["Add verified Kafka skill"],
                hallucination_flags=[],
            )
        else:
            return ATSCritique(
                score=90,
                passed=True,
                matched_keywords=["Go", "Python", "PostgreSQL", "Redis"],
                missing_must_have_skills=[],
                missing_ats_keywords=[],
                actionable_feedback=[],
                hallucination_flags=[],
            )

    resume_architect.default_llm_override = dynamic_architect
    ats_critic.default_llm_override = dynamic_critic

    try:
        resp2 = client.post(
            "/api/v1/pipeline/run",
            json={
                "vault": vault.model_dump(mode="json"),
                "raw_jd_text": "We are hiring a backend engineering intern with Go and Python experience at Razorpay Bangalore.",
            },
        )
        assert resp2.status_code == 200, f"Expected 200, got {resp2.status_code}: {resp2.text}"
        data2 = resp2.json()
        print(f"  Attempts: {data2['attempts']} | Status: {data2['status']} | Final Score: {data2['ats_critique']['score']}")
        assert data2["attempts"] == 2
        assert data2["status"] == "passed"
        assert data2["ats_critique"]["score"] == 90
        assert call_count["architect"] == 2
        assert call_count["critic"] == 2
        print("Retry loop recovery test passed.\n")
    finally:
        resume_architect.default_llm_override = None
        ats_critic.default_llm_override = None

    # TEST 3: Max Retries Cap
    # Critic always returns 65 -> stops cleanly after 2 retries (total 3 attempts, best_effort_after_max_retries)
    print("[TEST 3] Testing Max Retries Cap (Always Score 65 -> Max 3 attempts):")
    low_critique = ATSCritique(
        score=65,
        passed=False,
        matched_keywords=["Go"],
        missing_must_have_skills=["PostgreSQL", "Redis"],
        missing_ats_keywords=[],
        actionable_feedback=["Highlight Redis experience"],
        hallucination_flags=[],
    )

    resume_architect.default_llm_override = tailored_resume
    ats_critic.default_llm_override = low_critique

    try:
        resp3 = client.post(
            "/api/v1/pipeline/run",
            json={
                "vault": vault.model_dump(mode="json"),
                "raw_jd_text": "We are hiring a backend engineering intern with Go and Python experience at Razorpay Bangalore.",
            },
        )
        assert resp3.status_code == 200, f"Expected 200, got {resp3.status_code}: {resp3.text}"
        data3 = resp3.json()
        print(f"  Attempts: {data3['attempts']} | Status: {data3['status']} | Final Score: {data3['ats_critique']['score']}")
        assert data3["attempts"] == 3
        assert data3["status"] == "best_effort_after_max_retries"
        assert data3["ats_critique"]["score"] == 65
        print("Max retries cap test passed.\n")
    finally:
        jd_decoder.default_llm_override = None
        resume_architect.default_llm_override = None
        ats_critic.default_llm_override = None

    # TEST 5: System Regression Checks
    print("[TEST 5] Full Pipeline Regression Checks:")
    health_resp = client.get("/health")
    assert health_resp.status_code == 200

    val_resp = client.post("/api/v1/vault/validate", json=vault.model_dump(mode="json"))
    assert val_resp.status_code == 200

    jd_decoder.default_llm_override = decoded_jd
    decode_resp = client.post("/api/v1/pipeline/decode-jd", json={
        "raw_jd_text": "We are hiring a backend engineering intern with Go and Python experience at Razorpay Bangalore."
    })
    assert decode_resp.status_code == 200

    resume_architect.default_llm_override = tailored_resume
    tailor_resp = client.post("/api/v1/pipeline/tailor-resume", json={
        "vault": vault.model_dump(mode="json"),
        "decoded_jd": decoded_jd.model_dump(mode="json"),
        "critic_feedback": []
    })
    assert tailor_resp.status_code == 200
    print("All regression checks passed successfully.\n")

    # TEST 6: Accounts Officer JD Exclusion Test
    print("[TEST 6] Testing Exclusion of Non-JD Skills for Accounts Officer JD:")
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
        eligibility_constraints=EligibilityConstraints(),
    )
    # Mock architect returning tech skills alongside one matching skill
    mock_acct_tailored = tailored_resume.model_copy(deep=True)
    mock_acct_tailored.matched_ats_keywords = ["Python", "SQL", "PostgreSQL", "Redis", "MS Office"]

    acct_critique = ATSCritique(
        score=75,
        passed=False,
        matched_keywords=["MS Office"],
        missing_must_have_skills=["Tally ERP", "GST", "TDS"],
        missing_ats_keywords=["Taxation", "Financial Accounting"],
        actionable_feedback=[],
        hallucination_flags=[],
    )

    jd_decoder.default_llm_override = accounts_jd
    resume_architect.default_llm_override = mock_acct_tailored
    ats_critic.default_llm_override = acct_critique

    try:
        acct_resp = client.post(
            "/api/v1/pipeline/run",
            json={
                "vault": vault.model_dump(mode="json"),
                "raw_jd_text": "Hiring an Accounts Officer with expertise in Tally ERP, GST, TDS, and MS Office.",
            },
        )
        assert acct_resp.status_code == 200
        acct_data = acct_resp.json()
        returned_matched = acct_data["tailored_resume"]["matched_ats_keywords"]
        critique_matched = acct_data["ats_critique"]["matched_keywords"]
        print(f"  Returned matched_ats_keywords: {returned_matched}")
        print(f"  Returned critique matched_keywords: {critique_matched}")
        for non_jd in ["Python", "SQL", "PostgreSQL", "Redis"]:
            assert non_jd not in returned_matched, f"False positive in tailored_resume: {non_jd}"
            assert non_jd not in critique_matched, f"False positive in critique: {non_jd}"
        assert "MS Office" in returned_matched
        print("Accounts Officer JD non-JD skills successfully excluded.\n")
    finally:
        jd_decoder.default_llm_override = None
        resume_architect.default_llm_override = None
        ats_critic.default_llm_override = None

    print("=== ALL STEP 2 ORCHESTRATOR TESTS PASSED SUCCESSFULLY ===")


if __name__ == "__main__":
    run_tests()
