"""Agent 1 (Step 2): Job Description Decoder Agent.

Deterministically extracts job portals from source URLs and invokes structured Gemini
models to parse ATS keywords, mandatory/optional competencies, and strict eligibility filters.
"""

import asyncio
import os
from typing import Any, Dict, Optional
from urllib.parse import urlparse
from dotenv import load_dotenv
from fastapi import HTTPException

from app.schemas.pipeline import DecodedJD, EligibilityConstraints

load_dotenv()

# Module-level override hook for deterministic testing without external API calls
default_llm_override: Optional[Any] = None

# Comprehensive map of 21+ Indian & global job portals to normalized portal slugs
PORTAL_DOMAIN_MAPPINGS: Dict[str, str] = {
    # Indian Student & Internship Platforms
    "internshala.com": "internshala",
    "unstop.com": "unstop",
    "freshersworld.com": "freshersworld",
    "hiremee.co.in": "hiremee",
    "hiremee.com": "hiremee",
    "lineupx.com": "lineupx",
    "cuvette.tech": "cuvette",
    "letsintern.com": "letsintern",
    "internshipuncle.com": "internshipuncle",
    "myinternships.in": "myinternships",
    "in.prosple.com": "prosple",
    "prosple.com": "prosple",
    # Indian Tech & Lateral Hiring Portals
    "naukri.com": "naukri",
    "instahyre.com": "instahyre",
    "cutshort.io": "cutshort",
    # Indian Government / National Apprenticeship & Internship Portals
    "pminternship.mca.gov.in": "pmis",
    "internship.aicte-india.org": "aicte",
    "aicte-india.org": "aicte",
    "nats.education.gov.in": "nats",
    "mhrdnats.gov.in": "nats",
    "ncs.gov.in": "ncs",
    # Global & Tech Ecosystems
    "linkedin.com": "linkedin",
    "wellfound.com": "wellfound",
    "angel.co": "wellfound",
    "indeed.com": "indeed",
    "workatastartup.com": "yc_waas",
    "ycombinator.com": "yc_waas",
    # Enterprise ATS Direct Portals
    "greenhouse.io": "greenhouse",
    "lever.co": "lever",
    "myworkdayjobs.com": "workday",
    "workday.com": "workday",
    "smartrecruiters.com": "smartrecruiters",
    "ashbyhq.com": "ashby",
}


def detect_portal_from_url(url: Optional[str]) -> str:
    """Deterministically map a job posting URL to one of 21+ known job portals.

    Strict hostname matching only (WC-6). Returns 'unknown' if not recognized.
    """
    if not url or not isinstance(url, str):
        return "unknown"

    clean_url = url.strip()
    if not clean_url:
        return "unknown"

    # Add scheme if missing for proper netloc parsing
    if not (clean_url.startswith("http://") or clean_url.startswith("https://")):
        clean_url = "https://" + clean_url

    try:
        parsed = urlparse(clean_url)
        hostname = (parsed.hostname or "").lower()
        if not hostname:
            return "unknown"

        # Match strictly against full domain or subdomains (never bare substring)
        for domain, slug in PORTAL_DOMAIN_MAPPINGS.items():
            domain_clean = domain.lower()
            if hostname == domain_clean or hostname.endswith("." + domain_clean):
                return slug

    except Exception:
        return "unknown"

    return "unknown"


async def decode_jd(
    raw_jd_text: str,
    source_url: Optional[str] = None,
    llm_override: Optional[Any] = None
) -> DecodedJD:
    """Extract ATS keywords, skills, vibe, and eligibility constraints from raw JD text.

    Strict zero-hallucination policy: extracts only factual content present in the text.
    Protected by a 30-second timeout raising HTTP 504 (WC-7).
    """
    clean_text = (raw_jd_text or "").strip()
    if len(clean_text) < 50:
        raise HTTPException(
            status_code=422,
            detail="Job description text is too short to decode (minimum 50 characters required)."
        )

    detected_portal = detect_portal_from_url(source_url)
    active_override = llm_override or default_llm_override

    if active_override is not None:
        # Fast deterministic path for unit/acceptance testing
        if callable(active_override):
            result = active_override(clean_text, source_url)
        elif hasattr(active_override, "ainvoke"):
            result = await active_override.ainvoke(clean_text)
        elif hasattr(active_override, "invoke"):
            result = active_override.invoke(clean_text)
        else:
            result = active_override

        if isinstance(result, DecodedJD):
            decoded = result
        elif isinstance(result, dict):
            decoded = DecodedJD.model_validate(result)
        else:
            raise ValueError("LLM override output could not be converted to DecodedJD")
    else:
        # Live LLM generation via langchain-google-genai with timeout protection (WC-7)
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key.strip() == "" or api_key.startswith("your_"):
            raise HTTPException(
                status_code=503,
                detail="Gemini API key is not configured. Set GEMINI_API_KEY environment variable to enable live JD decoding."
            )

        from langchain_google_genai import ChatGoogleGenerativeAI

        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0.0,
            timeout=30.0,
        )
        structured_llm = llm.with_structured_output(DecodedJD)

        system_instruction = (
            "You are an expert Job Description Analyzer and ATS Strategist.\n"
            "Analyze the following job description and extract factual criteria strictly.\n"
            "STRICT RULES:\n"
            "1. Do NOT invent, assume, or fabricate any skill or requirement not present in the text.\n"
            "2. Separate must_have_skills from nice_to_have_skills.\n"
            "3. Identify role_level (intern, fresher, junior, mid, senior, unknown).\n"
            "4. Classify company_vibe (startup, corporate, govt, unknown).\n"
            "5. Extract any explicit eligibility constraints (minimum CGPA, allowed graduation years, maximum age, domicile).\n\n"
            f"Job Description Text:\n{clean_text}"
        )

        try:
            decoded = await asyncio.wait_for(
                structured_llm.ainvoke(system_instruction),
                timeout=30.0,
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=504,
                detail="JD decoding request timed out after 30 seconds."
            )

        if not isinstance(decoded, DecodedJD):
            decoded = DecodedJD.model_validate(decoded)

    # Reconcile detected portal from URL
    if detected_portal != "unknown":
        decoded.detected_portal = detected_portal
    elif not decoded.detected_portal:
        decoded.detected_portal = "unknown"

    return decoded
