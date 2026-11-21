"""Acceptance test suite for Micro-Task 10 (Step 5A):
Portal-Specific Application Pack Agent & Deterministic Eligibility Checker.
"""

import copy
import json
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.truth_vault import MasterTruthVault
from app.schemas.pipeline import DecodedJD, EligibilityConstraints
from app.schemas.portal_pack import (
    PortalApplicationPack,
    PortalPackRequest,
    ScreeningAnswer,
)
from app.agents.portal_pack import (
    GeneratedCollateral,
    evaluate_eligibility,
    classify_portal_category,
)
import app.agents.portal_pack as portal_pack_agent
import app.agents.jd_decoder as jd_decoder_agent

client = TestClient(app)


def mock_portal_pack_llm(request: PortalPackRequest) -> GeneratedCollateral:
    """Deterministic mock for application pack collateral synthesis."""
    portal = request.decoded_jd.detected_portal
    category = classify_portal_category(portal)
    candidate_name = request.vault.basics.full_name
    proj = request.vault.projects[0] if request.vault.projects else None
    proj_name = proj.name if proj else "IndicDoc"
    proj_stack = ", ".join(proj.tech_stack[:3]) if proj else "Python, Go"

    if category == "internship_screening":
        return GeneratedCollateral(
            screening_answers=[
                ScreeningAnswer(
                    question="Why should we hire you for this role?",
                    answer=f"I have practical experience building {proj_name} using {proj_stack}, perfectly matching your core technical needs.",
                ),
                ScreeningAnswer(
                    question="Share a relevant project and your key contribution.",
                    answer=f"I architected {proj_name}, optimizing indexing throughput and cutting hallucinated citations by 38%.",
                ),
                ScreeningAnswer(
                    question="Are you available for an immediate full-time internship?",
                    answer="Yes, I am a 2025 graduate available to join immediately for the required duration.",
                ),
            ],
            portal_tips=[
                "Highlight verified GitHub repository and live deployment links in your profile.",
                "Respond to employer assignment requests within 24 hours.",
            ],
        )
    elif category == "startup_outreach":
        return GeneratedCollateral(
            cold_email_subject=f"{request.decoded_jd.role_title} — {proj_stack} | {candidate_name}",
            cold_email_body=(
                f"Hi team, I built {proj_name} with {proj_stack} which solves similar scalability challenges to what you are tackling. "
                "My background is grounded in building distributed systems and high-throughput microservices. "
                "Would you be open to a brief 15-minute chat this week?"
            ),
            linkedin_dm=(
                f"Hi! Saw your opening for {request.decoded_jd.role_title}. Built {proj_name} using {proj_stack}. Would love to connect and share more!"
            ),
            portal_tips=[
                "Keep cold outreach emails under 80 words.",
                "Always link your live demo and GitHub repository in the sign-off.",
            ],
        )
    elif category == "govt_apprenticeship":
        return GeneratedCollateral(
            portal_tips=[
                "Ensure your NATS / PMIS student registration ID is verified.",
                "Keep scanned attested copies of provisional degree certificates ready.",
                "Verify that your primary bank account is seeded with Aadhaar (NPCI mapped) for DBT stipend payments.",
            ],
        )
    else:
        return GeneratedCollateral(
            cold_email_subject=f"Application: {request.decoded_jd.role_title} - {candidate_name}",
            cold_email_body=f"Hello, I am reaching out regarding the {request.decoded_jd.role_title} role. I bring verified experience in {proj_stack}.",
            linkedin_dm="Hi, I noticed the opening on your team and would appreciate the opportunity to connect.",
            portal_tips=["Ensure resume keywords match the job description."],
        )


def run_all_tests():
    print("=== Running Step 5A (Portal Pack & Eligibility) Acceptance Tests ===\n")

    # Load baseline test vault
    sample_vault_path = Path(__file__).parent / "sample_vault.json"
    with open(sample_vault_path, "r", encoding="utf-8") as f:
        vault_data = json.load(f)
    vault = MasterTruthVault.model_validate(vault_data)

    # Configure deterministic LLM override
    portal_pack_agent.default_llm_override = mock_portal_pack_llm

    try:
        # -------------------------------------------------------------
        # TEST 1: PMIS / Govt Eligibility Checker (Pass & Fail cases)
        # -------------------------------------------------------------
        print("[TEST 1] PMIS & Govt Eligibility Verification:")

        # Case 1A: Eligible candidate (CGPA 8.85 >= 7.5, Batch 2025 in [2025, 2026], Age 22 <= 24)
        jd_pass = DecodedJD(
            role_title="Software Engineering Intern",
            detected_portal="pmis",
            must_have_skills=["Go", "Python"],
            eligibility_constraints=EligibilityConstraints(
                min_cgpa=7.5,
                graduation_years=[2025, 2026],
                max_age=24,
                domicile_required=None,
            ),
        )
        res_pass = evaluate_eligibility(vault=vault, decoded_jd=jd_pass, candidate_age=22)
        print(f"  Case 1A (Pass): status={res_pass.status}, passed={len(res_pass.passed_checks)}")
        assert res_pass.status == "eligible", f"Expected eligible, got {res_pass.status}"
        assert len(res_pass.passed_checks) == 3, f"Expected 3 passed checks, got {res_pass.passed_checks}"
        assert len(res_pass.failed_checks) == 0

        # Case 1B: Ineligible candidate due to age (Age 28 > 24)
        res_fail_age = evaluate_eligibility(vault=vault, decoded_jd=jd_pass, candidate_age=28)
        print(f"  Case 1B (Fail Age): status={res_fail_age.status}, failed={res_fail_age.failed_checks}")
        assert res_fail_age.status == "ineligible", f"Expected ineligible, got {res_fail_age.status}"
        assert any("age" in f.lower() for f in res_fail_age.failed_checks)

        # Case 1C: Review Required (Age not provided when required)
        res_warn = evaluate_eligibility(vault=vault, decoded_jd=jd_pass, candidate_age=None)
        print(f"  Case 1C (Review Required): status={res_warn.status}, warnings={res_warn.warnings}")
        assert res_warn.status == "review_required", f"Expected review_required, got {res_warn.status}"
        assert any("age" in w.lower() for w in res_warn.warnings)

        print("  Test 1 passed successfully.\n")

        # -------------------------------------------------------------
        # TEST 2: Percentage Score Normalization (> 10.0 scale)
        # -------------------------------------------------------------
        print("[TEST 2] Academic Percentage Score Normalization:")

        # Clone vault with 85.0 percentage score (normalized to 8.5 CGPA)
        pct_vault_data = copy.deepcopy(vault_data)
        pct_vault_data["education"][0]["cgpa_or_percentage"] = 85.0
        pct_vault = MasterTruthVault.model_validate(pct_vault_data)

        jd_cgpa = DecodedJD(
            role_title="Backend Intern",
            detected_portal="aicte",
            must_have_skills=["Python"],
            eligibility_constraints=EligibilityConstraints(min_cgpa=7.5),
        )

        res_pct_pass = evaluate_eligibility(vault=pct_vault, decoded_jd=jd_cgpa)
        print(f"  Case 2A (85.0% >= 7.5 CGPA): status={res_pct_pass.status}")
        assert res_pct_pass.status == "eligible"
        assert any("normalized" in p.lower() for p in res_pct_pass.passed_checks)

        # Clone vault with 68.0 percentage score (normalized to 6.8 CGPA < 7.5)
        low_pct_data = copy.deepcopy(vault_data)
        low_pct_data["education"][0]["cgpa_or_percentage"] = 68.0
        low_pct_vault = MasterTruthVault.model_validate(low_pct_data)

        res_pct_fail = evaluate_eligibility(vault=low_pct_vault, decoded_jd=jd_cgpa)
        print(f"  Case 2B (68.0% < 7.5 CGPA): status={res_pct_fail.status}")
        assert res_pct_fail.status == "ineligible"
        assert any("normalized" in f.lower() for f in res_pct_fail.failed_checks)

        print("  Test 2 passed successfully.\n")

        # -------------------------------------------------------------
        # TEST 3: Internshala Application Pack Generation
        # -------------------------------------------------------------
        print("[TEST 3] Internshala Application Pack Endpoint:")

        jd_internshala = DecodedJD(
            role_title="Python Backend Developer Intern",
            company_name="Razorpay",
            detected_portal="internshala",
            must_have_skills=["Python", "FastAPI", "PostgreSQL"],
            eligibility_constraints=EligibilityConstraints(min_cgpa=7.0, graduation_years=[2025]),
        )

        payload_internshala = {
            "vault": vault.model_dump(mode="json"),
            "decoded_jd": jd_internshala.model_dump(mode="json"),
            "candidate_age": 22,
        }

        resp_internshala = client.post("/api/v1/portal-pack/generate", json=payload_internshala)
        assert resp_internshala.status_code == 200, f"Expected 200, got {resp_internshala.status_code}: {resp_internshala.text}"
        data_internshala = resp_internshala.json()

        print(f"  Portal Category: {data_internshala['portal_category']}")
        print(f"  Eligibility Status: {data_internshala['eligibility']['status']}")
        print(f"  Screening Answers count: {len(data_internshala['screening_answers'])}")
        assert data_internshala["portal_category"] == "internship_screening"
        assert data_internshala["eligibility"]["status"] == "eligible"
        assert len(data_internshala["screening_answers"]) >= 2
        assert len(data_internshala["portal_tips"]) >= 1

        print("  Test 3 passed successfully.\n")

        # -------------------------------------------------------------
        # TEST 4: Wellfound / Startup Outreach Pack
        # -------------------------------------------------------------
        print("[TEST 4] Wellfound / YC Startup Outreach Pack Endpoint:")

        jd_wellfound = DecodedJD(
            role_title="Software Engineer - Distributed Systems",
            company_name="ChronoTech (YC W24)",
            detected_portal="wellfound",
            must_have_skills=["Go", "Distributed Systems", "Redis"],
            eligibility_constraints=EligibilityConstraints(),
        )

        payload_wellfound = {
            "vault": vault.model_dump(mode="json"),
            "decoded_jd": jd_wellfound.model_dump(mode="json"),
        }

        resp_wellfound = client.post("/api/v1/portal-pack/generate", json=payload_wellfound)
        assert resp_wellfound.status_code == 200, f"Expected 200, got {resp_wellfound.status_code}: {resp_wellfound.text}"
        data_wellfound = resp_wellfound.json()

        print(f"  Portal Category: {data_wellfound['portal_category']}")
        print(f"  Cold Email Subject: {data_wellfound['cold_email_subject']}")
        print(f"  Cold Email Body: {data_wellfound['cold_email_body']}")
        print(f"  LinkedIn DM ({len(data_wellfound['linkedin_dm'])} chars): {data_wellfound['linkedin_dm']}")

        assert data_wellfound["portal_category"] == "startup_outreach"
        assert data_wellfound["cold_email_subject"] is not None and len(data_wellfound["cold_email_subject"]) > 0
        assert data_wellfound["cold_email_body"] is not None and len(data_wellfound["cold_email_body"]) > 0
        assert data_wellfound["linkedin_dm"] is not None
        assert len(data_wellfound["linkedin_dm"]) <= 300

        print("  Test 4 passed successfully.\n")

        # -------------------------------------------------------------
        # TEST 5: System Regression Checks
        # -------------------------------------------------------------
        print("[TEST 5] System Regression Checks:")

        # 5A: /health
        health_resp = client.get("/health")
        assert health_resp.status_code == 200
        assert health_resp.json() == {"status": "ok", "service": "resume-builder-api"}
        print("  /health passed.")

        # 5B: /api/v1/vault/validate
        vault_val_resp = client.post("/api/v1/vault/validate", json=vault_data)
        assert vault_val_resp.status_code == 200
        val_data = vault_val_resp.json()
        assert val_data["status"] == "valid"
        assert val_data["project_count"] == 3
        print("  /api/v1/vault/validate passed.")

        # 5C: /api/v1/pipeline/decode-jd with mock
        def mock_decode(text, url):
            return DecodedJD(
                role_title="Software Engineering Intern",
                detected_portal="internshala",
                must_have_skills=["Python", "Go"],
            )

        jd_decoder_agent.default_llm_override = mock_decode
        decode_resp = client.post(
            "/api/v1/pipeline/decode-jd",
            json={
                "raw_jd_text": "We are seeking a Software Engineering Intern with solid Python and Go fundamentals.",
                "source_url": "https://internshala.com/internship/detail/python-backend-intern-1234",
            },
        )
        assert decode_resp.status_code == 200
        assert decode_resp.json()["detected_portal"] == "internshala"
        print("  /api/v1/pipeline/decode-jd passed.")

        print("\n=== ALL STEP 5A PORTAL PACK & ELIGIBILITY TESTS PASSED SUCCESSFULLY ===")

    finally:
        portal_pack_agent.default_llm_override = None
        jd_decoder_agent.default_llm_override = None


if __name__ == "__main__":
    run_all_tests()
