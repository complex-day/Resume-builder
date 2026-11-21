"""Pydantic v2 schemas for Portal-Specific Application Pack and Eligibility Verification.

Strictly complies with .agent/rules/truth-vault-rule.md and portal-ext-rule.md.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.truth_vault import MasterTruthVault
from app.schemas.pipeline import DecodedJD


class StrictPortalPackBase(BaseModel):
    """Base model enforcing zero-hallucination validation with strict whitespace stripping."""
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )


class EligibilityCheckResult(StrictPortalPackBase):
    """Deterministic eligibility check outcome against hard JD filters."""
    status: Literal["eligible", "review_required", "ineligible"] = Field(
        ...,
        description="'eligible' if all hard constraints pass, 'review_required' if missing data, 'ineligible' if failed"
    )
    passed_checks: List[str] = Field(
        default_factory=list,
        description="List of verified eligibility constraints passed by candidate"
    )
    failed_checks: List[str] = Field(
        default_factory=list,
        description="List of hard constraints violated by candidate profile"
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Warnings for constraints requiring candidate or recruiter review"
    )


class ScreeningAnswer(StrictPortalPackBase):
    """Portal-specific screening question and honest, vault-grounded response."""
    question: str = Field(..., min_length=1, description="Portal screening question")
    answer: str = Field(..., min_length=1, description="Factually grounded answer from candidate Truth Vault")


class PortalApplicationPack(StrictPortalPackBase):
    """Complete application collateral package tailored to specific job portal type."""
    portal_category: Literal[
        "internship_screening",
        "startup_outreach",
        "govt_apprenticeship",
        "standard_corporate",
    ] = Field(..., description="Target portal category archetype")
    detected_portal: str = Field(..., description="Normalized portal slug (e.g., internshala, wellfound, pmis)")
    eligibility: EligibilityCheckResult = Field(..., description="Deterministic eligibility verification result")
    screening_answers: List[ScreeningAnswer] = Field(
        default_factory=list,
        description="Screening Q&A populated for internship portals (Internshala, Cuvette, LetsIntern, Unstop)"
    )
    cold_email_subject: Optional[str] = Field(
        default=None,
        description="Punchy, professional subject line for founder/CTO outreach"
    )
    cold_email_body: Optional[str] = Field(
        default=None,
        description="Crisp 3-line founder cold email grounded strictly in vault projects and skills"
    )
    linkedin_dm: Optional[str] = Field(
        default=None,
        description="Under-300-char punchy direct message for startup recruiters / founders"
    )
    portal_tips: List[str] = Field(
        default_factory=list,
        description="2 to 3 concrete portal-specific tactical application tips"
    )


class PortalPackRequest(StrictPortalPackBase):
    """Request payload for deterministic eligibility check and portal pack generation."""
    vault: MasterTruthVault = Field(..., description="The candidate's Master Truth Vault")
    decoded_jd: DecodedJD = Field(..., description="The decoded target job description")
    candidate_age: Optional[int] = Field(
        default=None,
        ge=16,
        le=100,
        description="Candidate age for government / apprenticeship age restrictions"
    )
    candidate_domicile: Optional[str] = Field(
        default=None,
        description="Candidate state or regional domicile for regional eligibility checks"
    )
