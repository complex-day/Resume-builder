"""Acceptance tests for Agent 1 (JD Decoder) and portal detection."""

import json
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.agents import jd_decoder
from app.agents.jd_decoder import detect_portal_from_url
from app.schemas.pipeline import DecodedJD, EligibilityConstraints

client = TestClient(app)


def run_tests():
    print("=== Running Agent 1 (JD Decoder) Acceptance Tests ===\n")

    # 1. Test portal detection on at least 6 diverse portals + unknown
    test_portal_cases = [
        ("https://internshala.com/internship/detail/python-backend-intern-1234", "internshala"),
        ("https://wellfound.com/jobs/29381-backend-engineer", "wellfound"),
        ("https://www.linkedin.com/jobs/view/4028392182", "linkedin"),
        ("https://pminternship.mca.gov.in/portal/opportunities", "pmis"),
        ("https://internship.aicte-india.org/internship-details.php?id=99", "aicte"),
        ("https://www.workatastartup.com/companies/acme/jobs/123", "yc_waas"),
        ("https://unstop.com/internships/software-intern-456", "unstop"),
        ("https://naukri.com/job-listings-python-dev-789", "naukri"),
        ("https://nats.education.gov.in/student_type.php", "nats"),
        ("https://example.com/careers/unrecognized-posting", "unknown"),
        (None, "unknown"),
    ]

    print("[TEST 1] Testing Portal Detection for 21+ Mappings:")
    for url, expected in test_portal_cases:
        actual = detect_portal_from_url(url)
        print(f"  URL: {url} -> Detected: {actual} (Expected: {expected})")
        assert actual == expected, f"Failed for {url}: expected {expected}, got {actual}"
    print("All portal detection assertions passed successfully.\n")

    # 2. Test POST /api/v1/pipeline/decode-jd with realistic Indian Backend Intern JD + mock LLM
    realistic_jd = """
    Company: Razorpay Software Private Limited
    Role: Software Engineering Intern - Backend (Go / Python)
    Location: Bengaluru, Karnataka, India
    
    About the Role:
    We are looking for passionate 2025/2026 batch engineering graduates to join our Core Payments team.
    
    Key Responsibilities:
    - Build scalable microservices in Go and Python for payment processing.
    - Write unit tests and maintain >90% code coverage.
    - Optimize database queries on PostgreSQL and Redis.
    
    Requirements:
    - Must-have skills: Go, Python, REST APIs, PostgreSQL, Redis.
    - Nice-to-have: Docker, Kubernetes, Kafka, gRPC.
    - Strong problem solving and algorithmic foundations.
    
    Eligibility:
    - B.Tech/B.E. in Computer Science or related fields.
    - Minimum 7.5 CGPA or equivalent percentage.
    - 2025 or 2026 passouts only.
    """

    mock_decoded_response = DecodedJD(
        role_title="Software Engineering Intern - Backend",
        company_name="Razorpay Software Private Limited",
        role_level="intern",
        company_vibe="startup",
        detected_portal="internshala",
        must_have_skills=["Go", "Python", "REST APIs", "PostgreSQL", "Redis"],
        nice_to_have_skills=["Docker", "Kubernetes", "Kafka", "gRPC"],
        ats_keywords=["Microservices", "Payment Processing", "PostgreSQL", "Redis", "Unit Testing"],
        key_responsibilities=[
            "Build scalable microservices in Go and Python for payment processing",
            "Write unit tests and maintain >90% code coverage",
            "Optimize database queries on PostgreSQL and Redis"
        ],
        eligibility_constraints=EligibilityConstraints(
            min_cgpa=7.5,
            graduation_years=[2025, 2026],
            max_age=None,
            domicile_required=None,
            other_notes=["B.Tech/B.E. in Computer Science or related fields"]
        )
    )

    # Set mock override for deterministic offline testing
    jd_decoder.default_llm_override = mock_decoded_response

    try:
        print("[TEST 2] POST /api/v1/pipeline/decode-jd (Valid Realistic JD)")
        payload = {
            "raw_jd_text": realistic_jd,
            "source_url": "https://internshala.com/internship/detail/razorpay-backend-intern"
        }
        resp = client.post("/api/v1/pipeline/decode-jd", json=payload)
        print(f"Status Code: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        print(f"Decoded Role: {data['role_title']} at {data['company_name']}")
        print(f"Role Level: {data['role_level']} | Vibe: {data['company_vibe']} | Portal: {data['detected_portal']}")
        print(f"Must-have Skills: {data['must_have_skills']}")
        print(f"Eligibility Constraints: {data['eligibility_constraints']}")

        # Validate against DecodedJD schema
        validated_jd = DecodedJD.model_validate(data)
        assert validated_jd.role_level == "intern"
        assert validated_jd.company_vibe == "startup"
        assert validated_jd.detected_portal == "internshala"
        assert validated_jd.eligibility_constraints.min_cgpa == 7.5
        assert validated_jd.eligibility_constraints.graduation_years == [2025, 2026]
        print("Decoded JD strictly conforms to DecodedJD Pydantic schema.\n")

        # 3. Test short text (<50 characters) rejection (422)
        print("[TEST 3] POST /api/v1/pipeline/decode-jd (Short text rejection)")
        short_payload = {"raw_jd_text": "Too short JD"}
        short_resp = client.post("/api/v1/pipeline/decode-jd", json=short_payload)
        print(f"Status Code: {short_resp.status_code}")
        assert short_resp.status_code == 422, f"Expected 422, got {short_resp.status_code}"
        print("Short JD correctly rejected with HTTP 422.\n")

        # 4. Regression tests: /health and /api/v1/vault/validate
        print("[TEST 4] Regression Checks: /health and /api/v1/vault/validate")
        health_resp = client.get("/health")
        assert health_resp.status_code == 200
        assert health_resp.json() == {"status": "ok", "service": "resume-builder-api"}

        sample_vault_path = Path(__file__).parent / "sample_vault.json"
        with open(sample_vault_path, "r", encoding="utf-8") as f:
            sample_vault_data = json.load(f)
        validate_resp = client.post("/api/v1/vault/validate", json=sample_vault_data)
        assert validate_resp.status_code == 200
        assert validate_resp.json()["status"] == "valid"
        print("All regression checks passed successfully.\n")

        print("=== ALL AGENT 1 (JD DECODER) TESTS PASSED SUCCESSFULLY ===")

    finally:
        jd_decoder.default_llm_override = None


if __name__ == "__main__":
    run_tests()
