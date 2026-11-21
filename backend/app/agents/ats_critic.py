"""Agent 3 (Step 2): ATS Critic Agent.

Evaluates tailored resumes against job requirements deterministically:
- Calculates must-have and general ATS keyword coverage.
- Validates structural grounding against Master Truth Vault to detect hallucinations.
- Generates actionable feedback ONLY for keywords present in the Truth Vault (zero hallucination pressure).
"""

import os
import re
from typing import Any, List, Optional, Set
from dotenv import load_dotenv

from app.schemas.pipeline import ATSCritique, DecodedJD, TailoredResume
from app.schemas.truth_vault import MasterTruthVault

load_dotenv()

# Module-level override hook for deterministic testing
default_llm_override: Optional[Any] = None


def _matches_keyword(keyword: str, text: str, token_set: Set[str]) -> bool:
    """Check if keyword matches within text or direct token set."""
    kw = keyword.strip().lower()
    if not kw:
        return False
    if kw in token_set:
        return True
    pattern = r"\b" + re.escape(kw) + r"\b"
    return bool(re.search(pattern, text))


def evaluate_ats_deterministic(
    vault: MasterTruthVault,
    decoded_jd: DecodedJD,
    tailored: TailoredResume
) -> ATSCritique:
    """Deterministically score a tailored resume against the DecodedJD and Truth Vault."""
    # 1. Extract searchable text from tailored resume
    summary = tailored.professional_summary.lower()
    skills_list = [s.strip().lower() for cat in tailored.skills for s in cat.skills]
    exp_bullets = [b.strip().lower() for exp in tailored.experience for b in exp.bullets]
    proj_bullets = [b.strip().lower() for p in tailored.projects for b in p.bullets]
    proj_tech = [t.strip().lower() for p in tailored.projects for t in p.tech_stack]
    proj_names = [p.name.strip().lower() for p in tailored.projects]

    tailored_token_set = set(skills_list) | set(proj_tech)
    full_tailored_text = " ".join(
        [summary, " ".join(skills_list), " ".join(exp_bullets), " ".join(proj_bullets), " ".join(proj_tech), " ".join(proj_names)]
    )

    # 2. Extract facts from Master Truth Vault for grounding checks & honest feedback
    vault_skills = {s.strip().lower() for cat in vault.skills for s in cat.skills}
    vault_companies = {e.company.strip().lower() for e in vault.experience}
    vault_project_ids = {p.id.strip().lower() for p in vault.projects}
    vault_tech = (
        {t.strip().lower() for p in vault.projects for t in p.tech_stack}
        | {t.strip().lower() for e in vault.experience for t in e.tech_stack}
    )
    vault_all_text = " ".join([
        " ".join(vault_skills),
        " ".join(vault_tech),
        " ".join([h.lower() for e in vault.experience for h in e.highlights]),
        " ".join([h.lower() for p in vault.projects for h in p.highlights]),
        " ".join([p.description.lower() for p in vault.projects]),
    ])

    # 3. Grounding Sanity Check (Detect hallucinations)
    hallucination_flags: List[str] = []

    for exp in tailored.experience:
        if exp.company.strip().lower() not in vault_companies:
            hallucination_flags.append(
                f"Company '{exp.company}' not found in Truth Vault experience."
            )

    for proj in tailored.projects:
        if proj.source_project_id.strip().lower() not in vault_project_ids:
            hallucination_flags.append(
                f"Project ID '{proj.source_project_id}' not found in Truth Vault projects."
            )

    # 4. Keyword Matching
    matched_keywords: List[str] = []
    missing_must_have: List[str] = []
    for skill in decoded_jd.must_have_skills:
        if _matches_keyword(skill, full_tailored_text, tailored_token_set):
            matched_keywords.append(skill)
        else:
            missing_must_have.append(skill)

    missing_ats: List[str] = []
    for kw in decoded_jd.ats_keywords:
        if _matches_keyword(kw, full_tailored_text, tailored_token_set):
            if kw not in matched_keywords:
                matched_keywords.append(kw)
        else:
            missing_ats.append(kw)

    # 5. Score Calculation
    total_m = len(decoded_jd.must_have_skills)
    total_a = len(decoded_jd.ats_keywords)
    m_matched = total_m - len(missing_must_have)
    a_matched = total_a - len(missing_ats)

    if total_m > 0 and total_a > 0:
        base_score = int(round((m_matched / total_m) * 60.0 + (a_matched / total_a) * 40.0))
    elif total_m > 0:
        base_score = int(round((m_matched / total_m) * 100.0))
    elif total_a > 0:
        base_score = int(round((a_matched / total_a) * 100.0))
    else:
        base_score = 95

    # Penalize if hallucination detected
    if hallucination_flags:
        score = min(base_score, 40)
    else:
        score = max(0, min(100, base_score))

    # 6. Actionable Feedback (ONLY for keywords honestly found in Truth Vault!)
    actionable_feedback: List[str] = []
    for item in missing_must_have + missing_ats:
        item_clean = item.strip().lower()
        if (
            item_clean in vault_skills
            or item_clean in vault_tech
            or _matches_keyword(item, vault_all_text, vault_skills | vault_tech)
        ):
            actionable_feedback.append(
                f"Incorporate verified skill '{item}' from Truth Vault into tailored skills or project bullets."
            )

    passed = (score >= 85) and (len(hallucination_flags) == 0)

    return ATSCritique(
        score=score,
        passed=passed,
        matched_keywords=matched_keywords,
        missing_must_have_skills=missing_must_have,
        missing_ats_keywords=missing_ats,
        actionable_feedback=actionable_feedback,
        hallucination_flags=hallucination_flags,
    )


async def critique_resume(
    vault: MasterTruthVault,
    decoded_jd: DecodedJD,
    tailored: TailoredResume,
    llm_override: Optional[Any] = None
) -> ATSCritique:
    """Evaluate and critique tailored resume.

    Defaults to evaluate_ats_deterministic for fast, transparent, zero-hallucination scoring.
    """
    active_override = llm_override or default_llm_override

    if active_override is not None:
        if callable(active_override):
            result = active_override(vault, decoded_jd, tailored)
        elif hasattr(active_override, "ainvoke"):
            result = await active_override.ainvoke({"vault": vault, "jd": decoded_jd, "tailored": tailored})
        elif hasattr(active_override, "invoke"):
            result = active_override.invoke({"vault": vault, "jd": decoded_jd, "tailored": tailored})
        else:
            result = active_override

        if isinstance(result, ATSCritique):
            return result
        elif isinstance(result, dict):
            return ATSCritique.model_validate(result)
        else:
            raise ValueError("Critic override output could not be parsed into ATSCritique")

    return evaluate_ats_deterministic(vault, decoded_jd, tailored)
