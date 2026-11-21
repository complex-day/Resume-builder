"""Agent 3 (Step 2): ATS Critic Agent.

Evaluates tailored resumes against job requirements deterministically:
- Calculates must-have and general ATS keyword coverage.
- Validates structural grounding against Master Truth Vault to detect hallucinations.
- Generates actionable feedback ONLY for keywords present in the Truth Vault (zero hallucination pressure).
"""

import os
import re
from typing import Any, Dict, List, Optional, Set
from dotenv import load_dotenv

from app.schemas.pipeline import ATSCritique, DecodedJD, TailoredResume
from app.schemas.truth_vault import MasterTruthVault

load_dotenv()

# Module-level override hook for deterministic testing
default_llm_override: Optional[Any] = None

COMMON_STOPWORDS: Set[str] = {
    "and", "or", "the", "a", "an", "in", "on", "at", "to", "for", "with",
    "by", "of", "from", "as", "is", "are", "via", "using", "into", "etc"
}

SYNONYM_MAP: Dict[str, List[str]] = {
    "sdlc": [
        "software development life cycle",
        "software development lifecycle",
        "system development life cycle",
        "development life cycle",
        "development lifecycle",
        "ci/cd",
        "cicd",
        "deployment pipelines",
        "agile",
        "scrum",
    ],
    "software development life cycle": [
        "sdlc",
        "software development lifecycle",
        "ci/cd",
        "cicd",
        "deployment pipelines",
    ],
    "software development lifecycle": [
        "sdlc",
        "software development life cycle",
        "ci/cd",
        "cicd",
        "deployment pipelines",
    ],
    "tdd": [
        "test driven development",
        "test-driven development",
        "unit testing",
        "unit tests",
        "contract tests",
        "test coverage",
        "pytest",
        "jest",
    ],
    "test-driven development": [
        "tdd",
        "test driven development",
        "unit testing",
        "unit tests",
        "contract tests",
        "test coverage",
    ],
    "test driven development": [
        "tdd",
        "test-driven development",
        "unit testing",
        "unit tests",
        "contract tests",
        "test coverage",
    ],
    "oop": ["object oriented programming", "object-oriented programming"],
    "object-oriented programming": ["oop", "object oriented programming"],
    "object oriented programming": ["oop", "object-oriented programming"],
    "ci/cd": ["cicd", "continuous integration", "continuous deployment"],
    "cicd": ["ci/cd", "continuous integration", "continuous deployment"],
    "continuous integration": ["ci/cd", "cicd"],
    "continuous deployment": ["ci/cd", "cicd"],
    "rest api": ["rest apis", "restful api", "restful apis", "rest"],
    "rest apis": ["rest api", "restful api", "restful apis", "rest"],
    "restful api": ["rest api", "rest apis", "rest"],
    "restful apis": ["rest api", "rest apis", "rest"],
    "front-end": [
        "frontend",
        "front end",
        "react",
        "next.js",
        "vue",
        "angular",
        "html",
        "css",
    ],
    "frontend": [
        "front-end",
        "front end",
        "react",
        "next.js",
        "vue",
        "angular",
        "html",
        "css",
    ],
    "front end": [
        "frontend",
        "front-end",
        "react",
        "next.js",
        "vue",
        "angular",
        "html",
        "css",
    ],
    "back-end": [
        "backend",
        "back end",
        "fastapi",
        "node.js",
        "nodejs",
        "express",
        "django",
        "flask",
        "spring",
        "go",
        "golang",
    ],
    "backend": [
        "back-end",
        "back end",
        "fastapi",
        "node.js",
        "nodejs",
        "express",
        "django",
        "flask",
        "spring",
        "go",
        "golang",
    ],
    "back end": [
        "backend",
        "back-end",
        "fastapi",
        "node.js",
        "nodejs",
        "express",
        "django",
        "flask",
        "spring",
        "go",
        "golang",
    ],
    "full-stack": ["fullstack", "full stack"],
    "fullstack": ["full-stack", "full stack"],
    "full stack": ["fullstack", "full-stack"],
    "k8s": ["kubernetes"],
    "kubernetes": ["k8s"],
    "ml": ["machine learning"],
    "machine learning": ["ml"],
    "ai": ["artificial intelligence"],
    "artificial intelligence": ["ai"],
    "golang": ["go"],
    "go": ["golang"],
    "postgres": ["postgresql"],
    "postgresql": ["postgres"],
    "backend integrations": [
        "backend",
        "rest apis",
        "microservices",
        "apis",
        "backend integrations",
    ],
    "backend integration": [
        "backend",
        "rest apis",
        "microservices",
        "apis",
        "backend integrations",
        "backend integration",
    ],
    "frontend components": [
        "frontend",
        "front-end",
        "react",
        "next.js",
        "components",
        "frontend components",
    ],
    "frontend component": [
        "frontend",
        "front-end",
        "react",
        "next.js",
        "components",
        "frontend components",
        "frontend component",
    ],
    "production": [
        "deployment",
        "deployed",
        "deploy",
        "production",
        "live",
        "cloud deployment",
    ],
    "problem solving": [
        "problem-solving",
        "analytical",
        "algorithms",
        "problem solving",
    ],
    "problem-solving": ["problem solving", "analytical", "algorithms"],
    "software development": [
        "software engineering",
        "software developer",
        "full stack",
        "backend developer",
        "software development",
    ],
    "javascript": ["js", "typescript", "ts"],
    "js": ["javascript"],
    "typescript": ["ts", "javascript"],
    "ts": ["typescript", "javascript"],
}


def _normalize_tokens(text: str) -> List[str]:
    """Extract lowercase alphanumeric tokens, stripping punctuation."""
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    return [t for t in cleaned.split() if t]


def _normalize_compact(text: str) -> str:
    """Lowercase string with spaces, hyphens, and slashes removed (e.g. 'front-end' -> 'frontend')."""
    return re.sub(r"[\s\-_/]", "", text.lower())


def _matches_keyword(
    keyword: str,
    text: str,
    token_set: Set[str],
    norm_text_tokens: Set[str],
    compact_token_set: Set[str],
) -> bool:
    """Check if keyword matches within text or direct token set.

    - Normalizes case, punctuation, and hyphens (front-end == frontend).
    - Checks synonym and acronym mapping (SDLC <-> Software Development Life Cycle, TDD <-> Test-driven development).
    - Multi-word phrases match if all meaningful non-stopword tokens appear in the text.
    - Single-word skills (e.g. 'Java') require exact word-boundary matches to strictly prevent hallucinations (never matching 'JavaScript').
    """
    kw_raw = keyword.strip()
    if not kw_raw:
        return False
    kw_lower = kw_raw.lower()

    # 1. Exact match in token set
    if kw_lower in token_set:
        return True

    # 2. Exact word-boundary regex in raw text (case-insensitive)
    escaped = re.escape(kw_lower)
    if re.search(r"\b" + escaped + r"\b", text):
        return True

    # 3. Compact representation (hyphens/spaces removed: 'front-end' -> 'frontend')
    kw_compact = _normalize_compact(kw_lower)
    if kw_compact in compact_token_set:
        return True

    # 4. Synonym / Acronym mapping lookup
    for syn in SYNONYM_MAP.get(kw_lower, []):
        if syn in token_set:
            return True
        if re.search(r"\b" + re.escape(syn) + r"\b", text):
            return True
        if _normalize_compact(syn) in compact_token_set:
            return True

    # 5. Token overlap for multi-word phrases (>= 2 meaningful tokens)
    # Strictly gated for multi-word phrases so single-word skills like 'Java' NEVER hallucinate
    kw_tokens = [t for t in _normalize_tokens(kw_lower) if t not in COMMON_STOPWORDS]
    if len(kw_tokens) >= 2:
        norm_text = " ".join(_normalize_tokens(text))
        kw_norm_phrase = " ".join(kw_tokens)
        if kw_norm_phrase in norm_text:
            return True
        compact_norm_text = _normalize_compact(text)
        if kw_compact and kw_compact in compact_norm_text:
            return True
        if all(token in norm_text_tokens for token in kw_tokens):
            return True

    return False


def evaluate_ats_deterministic(
    vault: MasterTruthVault,
    decoded_jd: DecodedJD,
    tailored: TailoredResume
) -> ATSCritique:
    """Deterministically score a tailored resume against the DecodedJD and Truth Vault.

    Well-calibrated 0-100 ATS scoring combining:
    - Must-have skills match (40%)
    - ATS keywords coverage (30%)
    - Role & domain alignment (15%)
    - Quantified impact, STAR action verbs & depth (15%)
    """
    # 1. Extract searchable text from tailored resume
    summary = tailored.professional_summary.lower()
    skills_list = [s.strip().lower() for cat in tailored.skills for s in cat.skills]
    exp_bullets = [b.strip().lower() for exp in tailored.experience for b in exp.bullets]
    proj_bullets = [b.strip().lower() for p in tailored.projects for b in p.bullets]
    proj_tech = [t.strip().lower() for p in tailored.projects for t in p.tech_stack]
    proj_names = [p.name.strip().lower() for p in tailored.projects]
    target_role = tailored.target_role.strip().lower()

    tailored_token_set = (
        set(skills_list)
        | set(proj_tech)
        | {target_role}
        | {p.name.strip().lower() for p in tailored.projects}
    )
    compact_tailored_tokens = {_normalize_compact(t) for t in tailored_token_set}

    full_tailored_text = " ".join([
        target_role,
        summary,
        " ".join(skills_list),
        " ".join(exp_bullets),
        " ".join(proj_bullets),
        " ".join(proj_tech),
        " ".join(proj_names),
    ])
    norm_tailored_tokens = set(_normalize_tokens(full_tailored_text))

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
    norm_vault_tokens = set(_normalize_tokens(vault_all_text))
    compact_vault_tokens = {_normalize_compact(t) for t in (vault_skills | vault_tech)}

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
        if _matches_keyword(skill, full_tailored_text, tailored_token_set, norm_tailored_tokens, compact_tailored_tokens):
            matched_keywords.append(skill)
        else:
            missing_must_have.append(skill)

    missing_ats: List[str] = []
    for kw in decoded_jd.ats_keywords:
        if _matches_keyword(kw, full_tailored_text, tailored_token_set, norm_tailored_tokens, compact_tailored_tokens):
            if kw not in matched_keywords:
                matched_keywords.append(kw)
        else:
            missing_ats.append(kw)

    # 5. Score Calculation (0-100 Well-Calibrated ATS Scoring)
    total_m = len(decoded_jd.must_have_skills)
    m_matched = total_m - len(missing_must_have)
    score_must_have = (m_matched / total_m) * 40.0 if total_m > 0 else 40.0

    total_a = len(decoded_jd.ats_keywords)
    a_matched = total_a - len(missing_ats)
    score_ats = (a_matched / total_a) * 30.0 if total_a > 0 else 30.0

    # Role & Domain Alignment (15 pts)
    role_tokens = [t for t in _normalize_tokens(decoded_jd.role_title) if t not in COMMON_STOPWORDS]
    if role_tokens:
        role_matches = sum(1 for t in role_tokens if t in norm_tailored_tokens)
        score_role = (role_matches / len(role_tokens)) * 15.0
    else:
        score_role = 15.0

    # Quantified Impact & Professional Structure (15 pts)
    # 5a. Quantified metrics in bullets (up to 5 pts)
    bullet_text = " ".join(exp_bullets + proj_bullets)
    metric_matches = re.findall(r"\b\d+(?:\.\d+)?(?:%|\+|x|k|m|ms)?\b", bullet_text)
    if len(metric_matches) >= 3:
        score_metrics = 5.0
    elif len(metric_matches) >= 1:
        score_metrics = 3.0
    else:
        score_metrics = 0.0

    # 5b. Strong action verbs (up to 5 pts)
    ENGINEERING_ACTION_VERBS = {
        "engineered", "architected", "built", "developed", "optimized",
        "designed", "reduced", "implemented", "deployed", "automated",
        "created", "scaled", "integrated", "maintained", "orchestrated",
        "streamlined", "accelerated", "modeled", "monitored", "delivered"
    }
    verb_matches = len(ENGINEERING_ACTION_VERBS.intersection(norm_tailored_tokens))
    if verb_matches >= 3:
        score_verbs = 5.0
    elif verb_matches >= 1:
        score_verbs = 3.0
    else:
        score_verbs = 0.0

    # 5c. Technical depth (up to 5 pts)
    if len(tailored.projects) >= 2 and len(skills_list) >= 4:
        score_depth = 5.0
    elif len(tailored.projects) >= 1 and len(skills_list) >= 2:
        score_depth = 3.0
    else:
        score_depth = 0.0

    score_impact = score_metrics + score_verbs + score_depth
    base_score = int(round(score_must_have + score_ats + score_role + score_impact))

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
            or _matches_keyword(item, vault_all_text, vault_skills | vault_tech, norm_vault_tokens, compact_vault_tokens)
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
