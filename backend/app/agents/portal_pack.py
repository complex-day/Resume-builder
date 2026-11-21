"""Agent 4 (Step 5A): Portal-Specific Application Pack Agent & Eligibility Checker.

Deterministically verifies candidate eligibility against hard constraints (CGPA, batches,
max age, domicile) and generates portal-customized collateral (Internshala screening answers,
Wellfound/YC founder cold emails, and government apprenticeship checklists) strictly grounded
in the Master Truth Vault.
"""

import asyncio
import os
import re
from typing import Any, List, Optional
from dotenv import load_dotenv
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.truth_vault import MasterTruthVault
from app.schemas.pipeline import DecodedJD
from app.schemas.portal_pack import (
    EligibilityCheckResult,
    PortalApplicationPack,
    PortalPackRequest,
    ScreeningAnswer,
)

load_dotenv()

# Module-level override hook for deterministic offline testing
default_llm_override: Optional[Any] = None


class GeneratedCollateral(BaseModel):
    """Internal structured LLM output model for portal application collateral."""
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    screening_answers: List[ScreeningAnswer] = Field(default_factory=list)
    cold_email_subject: Optional[str] = None
    cold_email_body: Optional[str] = None
    linkedin_dm: Optional[str] = None
    portal_tips: List[str] = Field(default_factory=list)


def evaluate_eligibility(
    vault: MasterTruthVault,
    decoded_jd: DecodedJD,
    candidate_age: Optional[int] = None,
    candidate_domicile: Optional[str] = None,
) -> EligibilityCheckResult:
    """Deterministically evaluate candidate qualifications against JD eligibility constraints.

    Pure deterministic logic with zero LLM hallucination:
    - CGPA / Percentage normalization (scores > 10.0 normalized by dividing by 10)
    - Graduation year verification against batch filters
    - Maximum age limits
    - Regional domicile requirements
    """
    passed_checks: List[str] = []
    failed_checks: List[str] = []
    warnings: List[str] = []

    constraints = decoded_jd.eligibility_constraints

    # ---------------------------------------------------------
    # 1. Academic CGPA / Percentage Check
    # ---------------------------------------------------------
    if constraints.min_cgpa is not None:
        min_cgpa = constraints.min_cgpa
        candidate_scores = []

        for edu in vault.education:
            raw_score = edu.cgpa_or_percentage
            if raw_score is None:
                continue

            try:
                if isinstance(raw_score, (int, float)):
                    num_val = float(raw_score)
                else:
                    cleaned = str(raw_score).replace("%", "").strip()
                    num_val = float(cleaned)
            except (ValueError, TypeError):
                continue

            if num_val > 10.0:
                # Percentage scale (e.g., 85.0 -> 8.5 CGPA equivalent)
                norm_val = round(num_val / 10.0, 2)
                candidate_scores.append((norm_val, num_val, True, edu.institution))
            else:
                candidate_scores.append((num_val, num_val, False, edu.institution))

        if not candidate_scores:
            warnings.append(
                f"JD specifies minimum CGPA of {min_cgpa}, but candidate education record contains no CGPA or percentage."
            )
        else:
            # Sort by normalized score descending
            candidate_scores.sort(key=lambda x: x[0], reverse=True)
            best_norm, original_score, is_percentage, institution = candidate_scores[0]

            if best_norm >= min_cgpa:
                if is_percentage:
                    passed_checks.append(
                        f"Academic score passed: {original_score}% at {institution} normalized to {best_norm:.2f} CGPA (required: >= {min_cgpa})."
                    )
                else:
                    passed_checks.append(
                        f"Academic score passed: {best_norm:.2f} CGPA at {institution} meets requirement (required: >= {min_cgpa})."
                    )
            else:
                if is_percentage:
                    failed_checks.append(
                        f"Academic score failed: {original_score}% at {institution} normalized to {best_norm:.2f} CGPA is below required {min_cgpa}."
                    )
                else:
                    failed_checks.append(
                        f"Academic score failed: {best_norm:.2f} CGPA at {institution} is below required {min_cgpa}."
                    )

    # ---------------------------------------------------------
    # 2. Graduation Year / Batch Check
    # ---------------------------------------------------------
    if constraints.graduation_years:
        req_years = set(constraints.graduation_years)
        candidate_grad_years = set()

        for edu in vault.education:
            if edu.graduation_year is not None:
                candidate_grad_years.add(edu.graduation_year)
            if edu.end_date:
                match = re.search(r"\b(19\d\d|20\d\d)\b", str(edu.end_date))
                if match:
                    candidate_grad_years.add(int(match.group(1)))

        if not candidate_grad_years:
            warnings.append(
                f"JD specifies graduation year filter {sorted(list(req_years))}, but candidate graduation year could not be determined from education records."
            )
        else:
            matching_years = candidate_grad_years.intersection(req_years)
            if matching_years:
                passed_checks.append(
                    f"Graduation batch requirement passed: candidate batch {sorted(list(matching_years))} matches required batches {sorted(list(req_years))}."
                )
            else:
                failed_checks.append(
                    f"Graduation batch failed: candidate graduation year(s) {sorted(list(candidate_grad_years))} not in required batches {sorted(list(req_years))}."
                )

    # ---------------------------------------------------------
    # 3. Maximum Age Restriction Check
    # ---------------------------------------------------------
    if constraints.max_age is not None:
        max_age = constraints.max_age
        if candidate_age is not None:
            if candidate_age <= max_age:
                passed_checks.append(
                    f"Age requirement passed: candidate age {candidate_age} <= maximum allowed age of {max_age}."
                )
            else:
                failed_checks.append(
                    f"Age requirement failed: candidate age {candidate_age} exceeds maximum permitted age of {max_age}."
                )
        else:
            warnings.append(
                f"Job specifies maximum age limit of {max_age}, but candidate age was not provided for verification."
            )

    # ---------------------------------------------------------
    # 4. Regional Domicile Requirement Check
    # ---------------------------------------------------------
    if constraints.domicile_required and constraints.domicile_required.strip():
        req_dom = constraints.domicile_required.strip()
        if candidate_domicile and candidate_domicile.strip():
            cand_dom = candidate_domicile.strip()
            if req_dom.lower() in cand_dom.lower() or cand_dom.lower() in req_dom.lower():
                passed_checks.append(
                    f"Domicile requirement passed: '{cand_dom}' satisfies required '{req_dom}'."
                )
            else:
                failed_checks.append(
                    f"Domicile requirement failed: candidate domicile '{cand_dom}' does not match required '{req_dom}'."
                )
        else:
            warnings.append(
                f"Job specifies regional domicile requirement of '{req_dom}', but candidate domicile was not provided."
            )

    # ---------------------------------------------------------
    # 5. Final Status Resolution
    # ---------------------------------------------------------
    if failed_checks:
        status = "ineligible"
    elif warnings:
        status = "review_required"
    else:
        status = "eligible"

    return EligibilityCheckResult(
        status=status,
        passed_checks=passed_checks,
        failed_checks=failed_checks,
        warnings=warnings,
    )


def classify_portal_category(detected_portal: str) -> str:
    """Classify normalized portal slug into archetype application category."""
    slug = (detected_portal or "").lower().strip()

    if slug in {
        "internshala", "cuvette", "letsintern", "unstop",
        "internshipuncle", "myinternships", "prosple"
    }:
        return "internship_screening"

    if slug in {"wellfound", "yc_waas", "cutshort", "instahyre"}:
        return "startup_outreach"

    if slug in {"pmis", "aicte", "nats", "ncs"}:
        return "govt_apprenticeship"

    return "standard_corporate"


async def generate_portal_pack(
    request: PortalPackRequest,
    llm_override: Optional[Any] = None,
) -> PortalApplicationPack:
    """Synthesize portal-customized application collateral and verify deterministic eligibility.

    Strictly grounded in Master Truth Vault facts with zero hallucination.
    """
    # 1. Deterministic Eligibility Evaluation (Pure Python, No LLM)
    eligibility = evaluate_eligibility(
        vault=request.vault,
        decoded_jd=request.decoded_jd,
        candidate_age=request.candidate_age,
        candidate_domicile=request.candidate_domicile,
    )

    portal_category = classify_portal_category(request.decoded_jd.detected_portal)
    active_override = llm_override or default_llm_override

    if active_override is not None:
        # Fast deterministic path for offline testing
        if callable(active_override):
            result = active_override(request)
        elif hasattr(active_override, "ainvoke"):
            result = await active_override.ainvoke(request)
        elif hasattr(active_override, "invoke"):
            result = active_override.invoke(request)
        else:
            result = active_override

        if isinstance(result, PortalApplicationPack):
            return result
        elif isinstance(result, GeneratedCollateral):
            collateral = result
        elif isinstance(result, dict):
            if "portal_category" in result and "eligibility" in result:
                return PortalApplicationPack.model_validate(result)
            collateral = GeneratedCollateral.model_validate(result)
        else:
            raise ValueError("LLM override output could not be converted to PortalApplicationPack")
    else:
        # Live generation with Gemini and timeout protection (WC-7)
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key.strip() == "" or api_key.startswith("your_"):
            raise HTTPException(
                status_code=503,
                detail="Gemini API key is not configured. Set GEMINI_API_KEY environment variable to enable live portal pack generation."
            )

        from langchain_google_genai import ChatGoogleGenerativeAI

        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0.2,
            timeout=60.0,
        )
        structured_llm = llm.with_structured_output(GeneratedCollateral)

        vault_summary = {
            "name": request.vault.basics.full_name,
            "headline": request.vault.basics.summary,
            "skills": [cat.model_dump() for cat in request.vault.skills],
            "projects": [
                {
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "tech_stack": p.tech_stack,
                    "metrics": p.metrics,
                }
                for p in request.vault.projects
            ],
            "experience": [
                {
                    "company": exp.company,
                    "role": exp.role,
                    "highlights": exp.highlights,
                    "tech_stack": exp.tech_stack,
                }
                for exp in request.vault.experience
            ],
        }

        system_instruction = (
            "You are the Portal-Specific Application Pack Agent for Resumme Builder.\n"
            "Generate high-impact application collateral tailored to the specific portal category.\n\n"
            "STRICT ZERO-HALLUCINATION RULES (.agent/rules/truth-vault-rule.md):\n"
            "1. ONLY reference real facts, projects, experience, metrics, and skills present in the candidate's Master Truth Vault.\n"
            "2. NEVER invent achievements, tools, degrees, or companies not found in the vault.\n\n"
            f"TARGET PORTAL: {request.decoded_jd.detected_portal} (Category: {portal_category})\n"
            f"TARGET ROLE: {request.decoded_jd.role_title} at {request.decoded_jd.company_name or 'Hiring Company'}\n"
            f"MUST-HAVE SKILLS: {request.decoded_jd.must_have_skills}\n\n"
            f"CANDIDATE TRUTH VAULT:\n{vault_summary}\n\n"
            "PORTAL COLLATERAL REQUIREMENTS:\n"
            "- If category is 'internship_screening' (Internshala, Cuvette, LetsIntern, Unstop):\n"
            "  * screening_answers: 2-3 honest answers to common questions (e.g., 'Why should we hire you?', 'Share a relevant project contribution', 'Availability').\n"
            "  * portal_tips: 2-3 concrete application tips for this portal.\n"
            "- If category is 'startup_outreach' (Wellfound, YC WaaS, Cutshort, Instahyre):\n"
            "  * cold_email_subject: Punchy, professional subject line mentioning role and key vault skill.\n"
            "  * cold_email_body: Exactly 3 crisp sentences to founder/CTO citing 1-2 real vault projects and asking for a short chat.\n"
            "  * linkedin_dm: Under 300 characters, punchy, conversational, referencing verified vault skills.\n"
            "  * portal_tips: 2-3 startup outreach tips.\n"
            "- If category is 'govt_apprenticeship' (PMIS, AICTE, NATS, NCS):\n"
            "  * portal_tips: 3 formal compliance checklist items (Aadhaar registration, attested certificates, bank account DBT seeding).\n"
            "- If category is 'standard_corporate':\n"
            "  * cold_email_subject: Professional referral request subject.\n"
            "  * cold_email_body: 3-4 sentence referral note for employee networking.\n"
            "  * linkedin_dm: Under 300 character networking message.\n"
            "  * portal_tips: 2-3 ATS matching and referral tips.\n"
        )

        try:
            collateral = await asyncio.wait_for(
                structured_llm.ainvoke(system_instruction),
                timeout=30.0,
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=504,
                detail="Portal application pack generation timed out after 30 seconds."
            )

        if not isinstance(collateral, GeneratedCollateral):
            collateral = GeneratedCollateral.model_validate(collateral)

    return PortalApplicationPack(
        portal_category=portal_category,
        detected_portal=request.decoded_jd.detected_portal,
        eligibility=eligibility,
        screening_answers=collateral.screening_answers,
        cold_email_subject=collateral.cold_email_subject,
        cold_email_body=collateral.cold_email_body,
        linkedin_dm=collateral.linkedin_dm,
        portal_tips=collateral.portal_tips,
    )
