"""Pipeline and agent schemas for Job Description decoding and resume tailoring."""

from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.truth_vault import MasterTruthVault


class StrictPipelineBase(BaseModel):
    """Base schema enforcing strict validation and forbidding extra fields."""
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
        populate_by_name=True,
    )


class JDDecodeRequest(StrictPipelineBase):
    """Request payload for decoding a raw job description."""
    raw_jd_text: str = Field(
        ...,
        min_length=50,
        description="Raw unformatted or HTML-stripped text of the job description"
    )
    source_url: Optional[str] = Field(
        default=None,
        description="Optional origin URL of the job posting for portal detection"
    )


class EligibilityConstraints(StrictPipelineBase):
    """Eligibility criteria and filter constraints extracted from the JD."""
    min_cgpa: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=10.0,
        description="Minimum CGPA/percentage converted to 10-point scale if specified"
    )
    graduation_years: List[int] = Field(
        default_factory=list,
        description="Eligible graduation batches (e.g., [2024, 2025])"
    )
    max_age: Optional[int] = Field(
        default=None,
        ge=16,
        le=70,
        description="Maximum age requirement if stated (common in PSUs/Govt/PMIS)"
    )
    domicile_required: Optional[str] = Field(
        default=None,
        description="State/region residency requirement if mandated"
    )
    other_notes: List[str] = Field(
        default_factory=list,
        description="Other mandatory constraints (e.g. branch restrictions, citizenship)"
    )


class DecodedJD(StrictPipelineBase):
    """Structured, factual output extracted from the Job Description by the JD Decoder Agent."""
    role_title: str = Field(..., min_length=1, description="Normalized job title")
    company_name: Optional[str] = Field(default=None, description="Hiring organization name if mentioned")
    role_level: Literal["intern", "fresher", "junior", "mid", "senior", "unknown"] = Field(
        default="unknown",
        description="Seniority level of the role"
    )
    company_vibe: Literal["startup", "corporate", "govt", "unknown"] = Field(
        default="unknown",
        description="Organizational environment and communication culture"
    )
    detected_portal: str = Field(
        default="unknown",
        description="Identified job portal source (e.g., 'internshala', 'unstop', 'linkedin')"
    )
    must_have_skills: List[str] = Field(
        default_factory=list,
        description="Mandatory technical competencies and tools explicitly required"
    )
    nice_to_have_skills: List[str] = Field(
        default_factory=list,
        description="Preferred, bonus, or secondary technical competencies"
    )
    ats_keywords: List[str] = Field(
        default_factory=list,
        description="High-frequency terminology, domain keywords, and acronyms"
    )
    key_responsibilities: List[str] = Field(
        default_factory=list,
        description="Key duties and day-to-day work highlights"
    )
    eligibility_constraints: EligibilityConstraints = Field(
        default_factory=EligibilityConstraints,
        description="Hard filters including CGPA, graduation years, and age restrictions"
    )


class TailoredExperience(StrictPipelineBase):
    """Tailored professional experience entry with STAR/XYZ bullets."""
    company: str = Field(..., min_length=1, description="Company or organization name")
    role: str = Field(..., min_length=1, description="Job title / designation")
    location: Optional[str] = Field(default=None, description="Location of work")
    start_date: str = Field(..., min_length=1, description="Start date (YYYY-MM)")
    end_date: Optional[str] = Field(default=None, description="End date (YYYY-MM or Present)")
    bullets: List[str] = Field(
        ...,
        min_length=1,
        description="Tailored STAR/XYZ bullet points grounded strictly in verified experience"
    )


class TailoredProject(StrictPipelineBase):
    """Tailored project entry selected strictly from the Master Truth Vault."""
    source_project_id: str = Field(
        ...,
        min_length=1,
        description="Exact source project ID matching MasterTruthVault.projects"
    )
    name: str = Field(..., min_length=1, description="Name of the project")
    tech_stack: List[str] = Field(
        default_factory=list,
        description="Technologies actively used in this project"
    )
    repo_url: Optional[str] = Field(default=None, description="Repository URL")
    live_url: Optional[str] = Field(default=None, description="Live deployment URL")
    bullets: List[str] = Field(
        ...,
        min_length=2,
        max_length=4,
        description="2 to 4 crisp STAR/XYZ action-verb bullet points"
    )


class TailoredSkillGroup(StrictPipelineBase):
    """Categorized technical skills relevant to target role."""
    category_name: str = Field(..., min_length=1, description="Category name (e.g., Languages, Frameworks)")
    skills: List[str] = Field(default_factory=list, description="List of verified skills")


class TailoredResume(StrictPipelineBase):
    """Tailored resume structured strictly from Master Truth Vault for a specific JD."""
    target_role: str = Field(..., min_length=1, description="Target job title")
    professional_summary: str = Field(
        ...,
        min_length=10,
        description="2-3 lines of ATS-friendly summary grounded strictly in vault facts"
    )
    selected_project_ids: List[str] = Field(
        ...,
        min_length=1,
        max_length=4,
        description="IDs of 1-4 top matching projects selected from the vault"
    )
    experience: List[TailoredExperience] = Field(
        default_factory=list,
        description="Tailored experience entries"
    )
    projects: List[TailoredProject] = Field(
        ...,
        min_length=1,
        max_length=4,
        description="1 to 4 tailored project entries selected from vault"
    )
    skills: List[TailoredSkillGroup] = Field(
        default_factory=list,
        description="Categorized relevant skills"
    )
    matched_ats_keywords: List[str] = Field(
        default_factory=list,
        description="Keywords from DecodedJD honestly present in the vault"
    )


class TailorResumeRequest(StrictPipelineBase):
    """Request payload for Agent 2: Resume Architect."""
    vault: MasterTruthVault = Field(..., description="The user's Master Truth Vault")
    decoded_jd: DecodedJD = Field(..., description="The decoded target job description")
    critic_feedback: List[str] = Field(
        default_factory=list,
        description="Optional feedback points from Agent 3 for iterative refinement"
    )


class ATSCritique(StrictPipelineBase):
    """Critique and ATS matching score generated by Agent 3 (ATS Critic)."""
    score: int = Field(..., ge=0, le=100, description="ATS match score from 0 to 100")
    passed: bool = Field(..., description="True if score >= 85 and no hallucination flags exist")
    matched_keywords: List[str] = Field(default_factory=list, description="Keywords from JD successfully matched")
    missing_must_have_skills: List[str] = Field(
        default_factory=list,
        description="Must-have skills missing from tailored resume"
    )
    missing_ats_keywords: List[str] = Field(
        default_factory=list,
        description="General ATS keywords missing from tailored resume"
    )
    actionable_feedback: List[str] = Field(
        default_factory=list,
        description="Specific improvement directions grounded ONLY in existing Truth Vault facts"
    )
    hallucination_flags: List[str] = Field(
        default_factory=list,
        description="Flags if any company, project ID, or ungrounded claim was detected"
    )


class PipelineRunRequest(StrictPipelineBase):
    """Request payload for the full multi-agent resume tailoring pipeline."""
    user_id: Optional[str] = Field(default=None, description="User ID to load vault from repository")
    vault: Optional[MasterTruthVault] = Field(default=None, description="Inline Master Truth Vault")
    raw_jd_text: str = Field(..., min_length=50, description="Raw job description text")
    source_url: Optional[str] = Field(default=None, description="Optional job posting URL")


class PipelineRunResponse(StrictPipelineBase):
    """Final output response of the 3-agent orchestration pipeline."""
    decoded_jd: DecodedJD = Field(..., description="Parsed criteria from the JD")
    tailored_resume: TailoredResume = Field(..., description="Tailored resume output")
    ats_critique: ATSCritique = Field(..., description="Final ATS critique and score")
    attempts: int = Field(..., ge=1, le=3, description="Total pipeline generation attempts (1 to 3)")
    status: Literal["passed", "best_effort_after_max_retries"] = Field(
        ...,
        description="'passed' if score >= 85, else 'best_effort_after_max_retries'"
    )
