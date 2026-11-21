"""Acceptance test suite for Micro-Task 11 (Step 5B):
48-Hour Proof-of-Work Skill Sprint & Interview Prep Agent.
"""

import json
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.truth_vault import MasterTruthVault
from app.schemas.pipeline import DecodedJD, EligibilityConstraints
from app.schemas.skill_sprint import (
    SkillGapSummary,
    SkillSprintPlan,
    SkillSprintRequest,
    TargetedInterviewQuestion,
    WeekendMiniProject,
)
from app.schemas.portal_pack import PortalPackRequest, ScreeningAnswer
import app.agents.skill_sprint as skill_sprint_agent
import app.agents.portal_pack as portal_pack_agent
from app.agents.skill_sprint import compute_skill_gap, GeneratedSprintContent
from app.agents.portal_pack import GeneratedCollateral

client = TestClient(app)


def mock_sprint_llm(request: SkillSprintRequest, skill_gap: SkillGapSummary) -> GeneratedSprintContent:
    """Deterministic mock for weekend mini-project and 10 interview questions."""
    role = request.decoded_jd.role_title
    focus_skills = skill_gap.missing_must_have_skills if skill_gap.missing_must_have_skills else ["Go", "Distributed Systems"]
    focus_str = ", ".join(focus_skills)

    mini_project = WeekendMiniProject(
        title=f"CloudPulse - Scalable Event Ingestion Microservice with {focus_str}",
        target_skills=focus_skills,
        problem_statement=f"Build an end-to-end resilient event pipeline closing knowledge gaps in {focus_str}.",
        tech_stack=focus_skills + ["Docker", "Prometheus"],
        day_1_milestones=[
            "Design system architecture, write OpenAPI contracts, and scaffold repository.",
            f"Implement core data streaming and processing pipelines utilizing {focus_str}.",
            "Configure local Docker Compose environment with containerized worker nodes.",
        ],
        day_2_milestones=[
            "Implement unit and integration tests achieving >85% branch coverage.",
            "Benchmark latency and throughput under synthetic traffic bursts.",
            "Draft comprehensive architecture README with architecture diagram, and push repository to GitHub.",
        ],
        post_completion_resume_bullet_template=(
            f"Engineered an asynchronous event processing pipeline using {focus_str}, achieving sub-50ms ingestion latency and zero message loss under peak loads."
        ),
    )

    questions = [
        TargetedInterviewQuestion(
            question=f"How does {focus_skills[0] if focus_skills else 'Go'} handle concurrent network requests under high load?",
            category="technical",
            why_asked="Assess core runtime and memory model understanding.",
            crisp_answer_guide="Explain goroutine scheduler / event loop mechanisms, thread pooling, and non-blocking I/O multiplexing.",
        ),
        TargetedInterviewQuestion(
            question="What is the difference between buffered and unbuffered channels in Go?",
            category="technical",
            why_asked="Verify thread communication and synchronization fundamentals.",
            crisp_answer_guide="Unbuffered channels synchronize sender and receiver synchronously; buffered channels allow asynchronous sends until capacity is exceeded.",
        ),
        TargetedInterviewQuestion(
            question="How do you implement distributed locking in Redis to prevent duplicate webhook delivery?",
            category="technical",
            why_asked="Evaluate caching and distributed state knowledge.",
            crisp_answer_guide="Use SET key value NX PX with unique token per worker and Lua script for atomic token release.",
        ),
        TargetedInterviewQuestion(
            question="Design a high-throughput event logging pipeline handling 100,000 events/sec.",
            category="system_design",
            why_asked="Test distributed system design and backpressure handling.",
            crisp_answer_guide="Propose edge API gateways, partitioned Kafka topics, consumer worker pools with backpressure, and TimescaleDB/ClickHouse storage.",
        ),
        TargetedInterviewQuestion(
            question="How would you design rate limiting across a distributed microservice cluster?",
            category="system_design",
            why_asked="Gauge API gateway and security architecture skills.",
            crisp_answer_guide="Discuss Token Bucket algorithm implemented via Redis sliding windows or Envoy sidecars with local in-memory token replenishment.",
        ),
        TargetedInterviewQuestion(
            question="In your IndicDoc project, how did you prevent hallucinations when querying vernacular Indian language documents?",
            category="project_deep_dive",
            why_asked="Evaluate practical RAG engineering and model evaluation skills.",
            crisp_answer_guide="Discuss semantic chunking, BM25 + dense vector hybrid search, and strict context window prompting with citation grounding.",
        ),
        TargetedInterviewQuestion(
            question="In your ChronoQueue task scheduler, how did you guarantee at-least-once message delivery during abrupt node crashes?",
            category="project_deep_dive",
            why_asked="Probe fault-tolerance mechanisms in candidate's real codebase.",
            crisp_answer_guide="Explain Raft consensus state machine replication, persistent write-ahead logging (WAL), and worker heartbeat acknowledgments.",
        ),
        TargetedInterviewQuestion(
            question="In your SafePay UPI detector, why did you choose Redis Streams over standard Redis Pub/Sub?",
            category="project_deep_dive",
            why_asked="Check message broker trade-off awareness.",
            crisp_answer_guide="Redis Streams provides message persistence, consumer groups, and pending entry lists (PEL) for guaranteed acknowledgment, unlike ephemeral Pub/Sub.",
        ),
        TargetedInterviewQuestion(
            question="Describe a situation where you had to debug a production latency spike under time pressure.",
            category="behavioral",
            why_asked="Assess troubleshooting methodology and composure.",
            crisp_answer_guide="Detail observability tooling used (Prometheus/pprof), bottleneck identification (e.g. unindexed SQL query or mutex contention), and resolution.",
        ),
        TargetedInterviewQuestion(
            question="How do you handle disagreements on technical trade-offs within an engineering team?",
            category="behavioral",
            why_asked="Evaluate collaboration and engineering pragmatism.",
            crisp_answer_guide="Focus on objective benchmarking, writing RFCs/design docs with pros/cons, and committing to team decisions after constructive alignment.",
        ),
    ]

    return GeneratedSprintContent(
        mini_project=mini_project,
        interview_questions=questions,
    )


def run_all_tests():
    print("=== Running Step 5B (48-Hour Skill Sprint & Interview Prep) Acceptance Tests ===\n")

    # Load baseline test vault
    sample_vault_path = Path(__file__).parent / "sample_vault.json"
    with open(sample_vault_path, "r", encoding="utf-8") as f:
        vault_data = json.load(f)
    vault = MasterTruthVault.model_validate(vault_data)

    # Configure deterministic LLM override
    skill_sprint_agent.default_llm_override = mock_sprint_llm

    try:
        # -------------------------------------------------------------
        # TEST 1: Deterministic Skill Gap Detection
        # -------------------------------------------------------------
        print("[TEST 1] Deterministic Skill Gap Detection:")
        jd_with_gaps = DecodedJD(
            role_title="Senior Backend Systems Engineer",
            must_have_skills=["Go", "Python", "Kubernetes", "Apache Kafka"],
            nice_to_have_skills=["Terraform", "Prometheus"],
        )

        gap_summary = compute_skill_gap(vault=vault, decoded_jd=jd_with_gaps)
        print(f"  Existing matching: {gap_summary.existing_matching_skills}")
        print(f"  Missing must-have: {gap_summary.missing_must_have_skills}")
        print(f"  Missing nice-to-have: {gap_summary.missing_nice_to_have_skills}")

        # Assertions
        assert "Go" in gap_summary.existing_matching_skills
        assert "Python" in gap_summary.existing_matching_skills
        assert "Prometheus" in gap_summary.existing_matching_skills  # From vault.projects/skills
        assert "Kubernetes" in gap_summary.missing_must_have_skills
        assert "Apache Kafka" in gap_summary.missing_must_have_skills
        assert "Terraform" in gap_summary.missing_nice_to_have_skills
        print("  Test 1 passed successfully.\n")

        # -------------------------------------------------------------
        # TEST 2: Zero-Gap Edge Case
        # -------------------------------------------------------------
        print("[TEST 2] Zero-Gap Edge Case:")
        jd_zero_gap = DecodedJD(
            role_title="Backend Intern",
            must_have_skills=["Go", "Python", "FastAPI"],
            nice_to_have_skills=["PostgreSQL", "Docker"],
        )

        zero_gap_summary = compute_skill_gap(vault=vault, decoded_jd=jd_zero_gap)
        print(f"  Missing must-have count: {len(zero_gap_summary.missing_must_have_skills)}")
        assert len(zero_gap_summary.missing_must_have_skills) == 0
        assert len(zero_gap_summary.missing_nice_to_have_skills) == 0
        assert len(zero_gap_summary.existing_matching_skills) >= 3
        print("  Test 2 passed successfully.\n")

        # -------------------------------------------------------------
        # TEST 3: Endpoint Validation (POST /api/v1/skill-sprint/generate)
        # -------------------------------------------------------------
        print("[TEST 3] POST /api/v1/skill-sprint/generate Endpoint Test:")
        payload = {
            "vault": vault.model_dump(mode="json"),
            "decoded_jd": jd_with_gaps.model_dump(mode="json"),
        }

        resp = client.post("/api/v1/skill-sprint/generate", json=payload)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()

        # Validate Schema conformance
        plan = SkillSprintPlan.model_validate(data)
        print(f"  Role Title: {plan.role_title}")
        print(f"  Mini-Project Title: {plan.mini_project.title}")
        print(f"  Day 1 Milestones count: {len(plan.mini_project.day_1_milestones)}")
        print(f"  Day 2 Milestones count: {len(plan.mini_project.day_2_milestones)}")
        print(f"  Interview Questions count: {len(plan.interview_questions)}")
        print(f"  Truth Vault Reminder present: {'truth-vault-rule' in plan.truth_vault_reminder}")

        assert plan.role_title == jd_with_gaps.role_title
        assert len(plan.mini_project.day_1_milestones) >= 2
        assert len(plan.mini_project.day_2_milestones) >= 2
        assert len(plan.interview_questions) == 10
        assert "TRUTH VAULT REMINDER" in plan.truth_vault_reminder
        print("  Test 3 passed successfully.\n")

        # -------------------------------------------------------------
        # TEST 4: System Regression Checks
        # -------------------------------------------------------------
        print("[TEST 4] System Regression Checks:")

        # 4A: /health
        health_resp = client.get("/health")
        assert health_resp.status_code == 200
        assert health_resp.json() == {"status": "ok", "service": "resume-builder-api"}
        print("  /health passed.")

        # 4B: /api/v1/vault/validate
        vault_val_resp = client.post("/api/v1/vault/validate", json=vault_data)
        assert vault_val_resp.status_code == 200
        assert vault_val_resp.json()["status"] == "valid"
        print("  /api/v1/vault/validate passed.")

        # 4C: /api/v1/portal-pack/generate
        def mock_portal_collateral(request):
            return GeneratedCollateral(
                screening_answers=[
                    ScreeningAnswer(question="Why you?", answer="Proven experience.")
                ],
                portal_tips=["Be prompt."],
            )

        portal_pack_agent.default_llm_override = mock_portal_collateral
        pack_resp = client.post(
            "/api/v1/portal-pack/generate",
            json={
                "vault": vault.model_dump(mode="json"),
                "decoded_jd": {
                    "role_title": "Backend Intern",
                    "detected_portal": "internshala",
                    "must_have_skills": ["Python"],
                },
            },
        )
        assert pack_resp.status_code == 200
        assert pack_resp.json()["portal_category"] == "internship_screening"
        print("  /api/v1/portal-pack/generate passed.")

        print("\n=== ALL STEP 5B SKILL SPRINT TESTS PASSED SUCCESSFULLY ===")

    finally:
        skill_sprint_agent.default_llm_override = None
        portal_pack_agent.default_llm_override = None


if __name__ == "__main__":
    run_all_tests()
