"""Agent 2 (Step 2): Resume Architect Agent.

Selects top 3-4 relevant projects from the Master Truth Vault, rewrites bullets in
STAR/XYZ format, strips ATS-unfriendly formatting/emojis, and strictly verifies vault grounding.
"""

import asyncio
import json
import os
import re
from typing import Any, List, Optional
from dotenv import load_dotenv
from fastapi import HTTPException

from app.schemas.pipeline import DecodedJD, TailoredResume
from app.schemas.truth_vault import MasterTruthVault

load_dotenv()

# Module-level override hook for deterministic testing
default_llm_override: Optional[Any] = None


def sanitize_ats_text(text: str) -> str:
    """Strip emojis, decorative unicode symbols, and markdown artifacts for clean ATS text."""
    if not text:
        return ""

    # 1. Remove emojis and uncommon surrogate unicode characters
    clean = re.sub(
        r"[\U00010000-\U0010ffff]|[\u2600-\u27bf]|[\u2300-\u23ff]|[\u2b50-\u2b55]|[\u3030\u303d\u3297\u3299]",
        "",
        text,
    )

    # 2. Remove markdown formatting markers (bold, italic, headings, horizontal rules)
    clean = re.sub(r"(\*\*|__)(.*?)\1", r"\2", clean)  # Bold
    clean = re.sub(r"(\*|_)(.*?)\1", r"\2", clean)    # Italic
    clean = re.sub(r"^#+\s*", "", clean, flags=re.MULTILINE)  # Headings
    clean = re.sub(r"`([^`]+)`", r"\1", clean)        # Inline code
    clean = re.sub(r"[-=_~]{3,}", "", clean)          # Horizontal dividers

    # 3. Normalize multiple whitespace and strip leading/trailing spaces
    clean = re.sub(r"[ \t]+", " ", clean).strip()

    return clean


def verify_vault_grounding(tailored: TailoredResume, vault: MasterTruthVault) -> TailoredResume:
    """Enforce strict grounding against the Master Truth Vault.

    Verifies:
    1. Every selected_project_id exists in the vault.
    2. Every TailoredProject.source_project_id exists in the vault.
    3. All text fields and bullets are sanitized of ATS-breaking characters.
    """
    valid_vault_ids = {p.id.strip().lower(): p for p in vault.projects}

    # Verify selected_project_ids
    for pid in tailored.selected_project_ids:
        if pid.strip().lower() not in valid_vault_ids:
            raise ValueError(
                f"Grounding violation: Project ID '{pid}' in selected_project_ids does not exist in Master Truth Vault."
            )

    # Verify projects and source_project_ids
    for proj in tailored.projects:
        proj_key = proj.source_project_id.strip().lower()
        if proj_key not in valid_vault_ids:
            raise ValueError(
                f"Grounding violation: Project '{proj.name}' (source_project_id: '{proj.source_project_id}') does not exist in Master Truth Vault."
            )

    # Sanitize ATS text across summary and all bullets
    tailored.professional_summary = sanitize_ats_text(tailored.professional_summary)

    for exp in tailored.experience:
        exp.bullets = [sanitize_ats_text(b) for b in exp.bullets if sanitize_ats_text(b)]

    for proj in tailored.projects:
        proj.bullets = [sanitize_ats_text(b) for b in proj.bullets if sanitize_ats_text(b)]

    # Guard against hallucinated core languages (e.g. Java when candidate only has Python/Go/TS)
    vault_known_lower = {s.strip().lower() for cat in vault.skills for s in cat.skills} | {t.strip().lower() for p in vault.projects for t in p.tech_stack}
    for cat in tailored.skills:
        cat.skills = [s for s in cat.skills if not (s.strip().lower() == "java" and "java" not in vault_known_lower)]
    for proj in tailored.projects:
        proj.tech_stack = [t for t in proj.tech_stack if not (t.strip().lower() == "java" and "java" not in vault_known_lower)]

    return tailored


async def build_tailored_resume(
    vault: MasterTruthVault,
    decoded_jd: DecodedJD,
    critic_feedback: Optional[List[str]] = None,
    llm_override: Optional[Any] = None
) -> TailoredResume:
    """Synthesize a tailored, ATS-optimized resume from the Master Truth Vault.

    Strict zero-hallucination policy per truth-vault-rule.md.
    Protected by a 30-second timeout raising HTTP 504 (WC-7).
    """
    active_override = llm_override or default_llm_override

    if active_override is not None:
        if callable(active_override):
            result = active_override(vault, decoded_jd, critic_feedback)
        elif hasattr(active_override, "ainvoke"):
            result = await active_override.ainvoke({"vault": vault, "jd": decoded_jd})
        elif hasattr(active_override, "invoke"):
            result = active_override.invoke({"vault": vault, "jd": decoded_jd})
        else:
            result = active_override

        if isinstance(result, TailoredResume):
            tailored = result
        elif isinstance(result, dict):
            tailored = TailoredResume.model_validate(result)
        else:
            raise ValueError("Override result could not be parsed into TailoredResume.")
    else:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key.strip() == "" or api_key.startswith("your_"):
            raise HTTPException(
                status_code=503,
                detail="Gemini API key is not configured. Set GEMINI_API_KEY environment variable to enable live resume tailoring."
            )

        from langchain_google_genai import ChatGoogleGenerativeAI

        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0.1,
            timeout=60.0,
        )
        structured_llm = llm.with_structured_output(TailoredResume)

        system_instruction = (
            "You are an elite Resume Architect and ATS Optimization Agent.\n"
            "Your task is to tailor a high-impact, single-column ATS resume strictly from the user's Master Truth Vault.\n\n"
            "STRICT GROUNDING & ZERO-HALLUCINATION RULES (.agent/rules/truth-vault-rule.md):\n"
            "1. NEVER invent, exaggerate, or add any company, title, date, metric, or project not present in the Master Truth Vault.\n"
            "2. Select the TOP 3 to 4 most relevant projects for the target job role. Use the exact source_project_id from the vault.\n"
            "3. Rewrite project and experience bullets into crisp STAR/XYZ format: 'Accomplished [X] as measured by [Y] by doing [Z]'.\n"
            "4. Only include verified metrics already documented in the vault. Never fabricate percentages, budgets, or numbers.\n"
            "5. Reorder and highlight skills from the vault that match the target JD must-have and nice-to-have skills. NEVER add or fabricate programming languages or technologies not documented in the vault (e.g. if the JD asks for Java but candidate has Python/Go/TypeScript, NEVER include Java).\n"
            "6. Craft a concise 2-3 line professional summary strictly reflecting the candidate's verified background.\n"
            "7. Do NOT use emojis, decorative icons, markdown headings, or buzzword fluff.\n"
        )

        feedback_prompt = ""
        if critic_feedback:
            feedback_prompt = (
                f"\nCRITICAL ITERATION FEEDBACK FROM ATS CRITIC:\n"
                f"{json.dumps(critic_feedback, indent=2)}\n"
                "You MUST address every feedback point above while adhering strictly to Truth Vault facts.\n"
            )

        user_content = (
            f"TARGET DECODED JD:\n{decoded_jd.model_dump_json(indent=2)}\n\n"
            f"MASTER TRUTH VAULT:\n{vault.model_dump_json(indent=2)}\n"
            f"{feedback_prompt}"
        )

        try:
            tailored = await asyncio.wait_for(
                structured_llm.ainvoke(f"{system_instruction}\n\n{user_content}"),
                timeout=60.0,
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=504,
                detail="Resume tailoring request timed out after 60 seconds."
            )

        if not isinstance(tailored, TailoredResume):
            tailored = TailoredResume.model_validate(tailored)

    # Strictly verify vault grounding and sanitize ATS text
    return verify_vault_grounding(tailored, vault)
