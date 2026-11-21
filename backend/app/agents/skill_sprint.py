"""Agent 5 (Step 5B): 48-Hour Proof-of-Work Skill Sprint Agent.

Deterministically computes missing skills between candidate Master Truth Vault and target JD,
then generates a realistic weekend proof-of-work project plan (Day 1 & Day 2 milestones)
plus exactly 10 targeted interview prep questions strictly grounded in candidate background.
Strictly complies with .agent/rules/truth-vault-rule.md.
"""

import asyncio
import os
import re
from typing import Any, Dict, List, Optional, Set
from dotenv import load_dotenv
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.truth_vault import MasterTruthVault
from app.schemas.pipeline import DecodedJD
from app.schemas.skill_sprint import (
    SkillGapSummary,
    SkillSprintPlan,
    SkillSprintRequest,
    TargetedInterviewQuestion,
    WeekendMiniProject,
)

load_dotenv()

# Module-level override hook for deterministic testing without external API calls
default_llm_override: Optional[Any] = None

DEFAULT_TRUTH_VAULT_REMINDER = (
    "TRUTH VAULT REMINDER (.agent/rules/truth-vault-rule.md): This 48-Hour Proof-of-Work sprint is a "
    "forward-looking action plan. You MUST NOT add this mini-project, its tech stack, or unverified "
    "missing skills to your Master Truth Vault until you have actually written the code, implemented tests, "
    "and pushed a verified public GitHub repository."
)

SKILL_ALIASES: Dict[str, str] = {
    "golang": "go",
    "postgres": "postgresql",
    "k8s": "kubernetes",
    "reactjs": "react",
    "nodejs": "node.js",
    "vuejs": "vue",
    "ts": "typescript",
    "js": "javascript",
    "py": "python",
}


def _normalize_skill_token(skill: str) -> str:
    """Normalize skill string for case- and punctuation-insensitive matching."""
    cleaned = re.sub(r"[^a-z0-9+#.]", "", skill.lower().strip())
    return SKILL_ALIASES.get(cleaned, cleaned)


def compute_skill_gap(vault: MasterTruthVault, decoded_jd: DecodedJD) -> SkillGapSummary:
    """Deterministically compare verified Truth Vault skills against JD requirements.

    Pure deterministic Python logic with zero LLM hallucination:
    - Normalizes candidate skills from categories, project tech stacks, and experience
    - Accurately identifies matching vs missing must-have and nice-to-have competencies
    """
    candidate_normalized: Set[str] = set()

    # 1. Harvest skills from categorized skill lists
    for cat in vault.skills:
        for s in cat.skills:
            if s and s.strip():
                candidate_normalized.add(_normalize_skill_token(s))

    # 2. Harvest technologies actively used in projects
    for p in vault.projects:
        for t in p.tech_stack:
            if t and t.strip():
                candidate_normalized.add(_normalize_skill_token(t))

    # 3. Harvest technologies from verified work experience
    for exp in vault.experience:
        for t in exp.tech_stack:
            if t and t.strip():
                candidate_normalized.add(_normalize_skill_token(t))

    existing_matching: List[str] = []
    missing_must_have: List[str] = []
    missing_nice_to_have: List[str] = []

    # Check must-have competencies
    for skill in decoded_jd.must_have_skills:
        clean_skill = skill.strip()
        if not clean_skill:
            continue
        token = _normalize_skill_token(clean_skill)
        if token in candidate_normalized:
            if clean_skill not in existing_matching:
                existing_matching.append(clean_skill)
        else:
            if clean_skill not in missing_must_have:
                missing_must_have.append(clean_skill)

    # Check nice-to-have competencies
    for skill in decoded_jd.nice_to_have_skills:
        clean_skill = skill.strip()
        if not clean_skill:
            continue
        token = _normalize_skill_token(clean_skill)
        if token in candidate_normalized:
            if clean_skill not in existing_matching:
                existing_matching.append(clean_skill)
        else:
            if clean_skill not in missing_nice_to_have and clean_skill not in missing_must_have:
                missing_nice_to_have.append(clean_skill)

    return SkillGapSummary(
        existing_matching_skills=existing_matching,
        missing_must_have_skills=missing_must_have,
        missing_nice_to_have_skills=missing_nice_to_have,
    )


class GeneratedSprintContent(BaseModel):
    """Internal structured LLM output model for mini-project and interview Q&A."""
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    mini_project: WeekendMiniProject
    interview_questions: List[TargetedInterviewQuestion] = Field(
        ...,
        min_length=10,
        max_length=10,
        description="Exactly 10 targeted interview questions"
    )


async def generate_skill_sprint(
    request: SkillSprintRequest,
    llm_override: Optional[Any] = None,
) -> SkillSprintPlan:
    """Synthesize 48-Hour Proof-of-Work project and 10 targeted interview prep questions.

    Deterministic skill gap is computed first and can never be hallucinated by the LLM.
    """
    # 1. Deterministic Skill Gap Analysis (Pure Python, No LLM)
    skill_gap = compute_skill_gap(request.vault, request.decoded_jd)

    active_override = llm_override or default_llm_override

    if active_override is not None:
        # Fast deterministic path for offline testing
        if callable(active_override):
            result = active_override(request, skill_gap)
        elif hasattr(active_override, "ainvoke"):
            result = await active_override.ainvoke(request)
        elif hasattr(active_override, "invoke"):
            result = active_override.invoke(request)
        else:
            result = active_override

        if isinstance(result, SkillSprintPlan):
            # Ensure deterministic skill gap is preserved
            result.skill_gap = skill_gap
            result.truth_vault_reminder = DEFAULT_TRUTH_VAULT_REMINDER
            return result
        elif isinstance(result, GeneratedSprintContent):
            content = result
        elif isinstance(result, dict):
            if "mini_project" in result and "interview_questions" in result:
                content = GeneratedSprintContent.model_validate(result)
            else:
                raise ValueError("Dict output missing required sprint content fields")
        else:
            raise ValueError("LLM override output could not be converted to SkillSprintPlan")
    else:
        # Live generation via Gemini with timeout protection (WC-7)
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key.strip() == "" or api_key.startswith("your_"):
            raise HTTPException(
                status_code=503,
                detail="Gemini API key is not configured. Set GEMINI_API_KEY environment variable to enable live skill sprint generation."
            )

        from langchain_google_genai import ChatGoogleGenerativeAI

        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0.2,
            timeout=30.0,
        )
        structured_llm = llm.with_structured_output(GeneratedSprintContent)

        # Focus mini-project on closing missing skills, or deepening JD core if no gaps exist
        target_focus = (
            skill_gap.missing_must_have_skills[:3]
            or skill_gap.missing_nice_to_have_skills[:3]
            or (request.decoded_jd.must_have_skills[:3] if request.decoded_jd.must_have_skills else ["Core Architecture"])
        )

        real_projects_summary = [
            f"- {p.name} ({', '.join(p.tech_stack)}): {p.description}"
            for p in request.vault.projects
        ]

        system_instruction = (
            "You are an elite Staff Engineer and Interview Coach for Resumme Builder.\n"
            "Generate a realistic 48-Hour Proof-of-Work Weekend Mini-Project and exactly 10 targeted interview questions.\n\n"
            "STRICT ZERO-HALLUCINATION RULES (.agent/rules/truth-vault-rule.md):\n"
            "1. When crafting 'project_deep_dive' questions, reference ONLY real projects present in the candidate's Truth Vault:\n"
            f"{chr(10).join(real_projects_summary)}\n"
            "2. Do NOT invent past experiences or fabricated metrics.\n\n"
            f"TARGET ROLE: {request.decoded_jd.role_title} at {request.decoded_jd.company_name or 'Hiring Company'}\n"
            f"SKILL GAP (MISSING MUST-HAVE): {skill_gap.missing_must_have_skills}\n"
            f"SKILL GAP (MISSING NICE-TO-HAVE): {skill_gap.missing_nice_to_have_skills}\n"
            f"EXISTING MATCHING SKILLS: {skill_gap.existing_matching_skills}\n"
            f"PROJECT TARGET FOCUS: {target_focus}\n\n"
            "WEEKEND MINI-PROJECT REQUIREMENTS:\n"
            "- Scope must be achievable in 48 hours (Saturday + Sunday).\n"
            "- day_1_milestones: 2 to 4 concrete implementation steps for Saturday (architecture, scaffolding, core logic).\n"
            "- day_2_milestones: 2 to 4 concrete steps for Sunday (integration tests, README, live deployment, GitHub repo push).\n"
            "- post_completion_resume_bullet_template: 1 crisp STAR/XYZ bullet template with placeholders for real metrics.\n\n"
            "INTERVIEW QUESTIONS REQUIREMENTS:\n"
            "- Provide EXACTLY 10 targeted questions:\n"
            "  * 3-4 'technical' questions covering core JD languages/frameworks.\n"
            "  * 2 'system_design' questions relevant to the target role's domain.\n"
            "  * 2-3 'project_deep_dive' questions grilling into the candidate's actual projects listed above.\n"
            "  * 1-2 'behavioral' questions on engineering trade-offs, debugging, or production incidents.\n"
            "- For each question, provide a compelling 'why_asked' insight and a 'crisp_answer_guide'.\n"
        )

        try:
            content = await asyncio.wait_for(
                structured_llm.ainvoke(system_instruction),
                timeout=30.0,
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=504,
                detail="Skill sprint generation timed out after 30 seconds."
            )

        if not isinstance(content, GeneratedSprintContent):
            content = GeneratedSprintContent.model_validate(content)

    return SkillSprintPlan(
        role_title=request.decoded_jd.role_title,
        skill_gap=skill_gap,
        mini_project=content.mini_project,
        interview_questions=content.interview_questions,
        truth_vault_reminder=DEFAULT_TRUTH_VAULT_REMINDER,
    )
