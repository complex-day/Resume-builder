"""Master Truth Vault Pydantic v2 schemas.

Enforces zero-hallucination boundaries as defined in .agent/rules/truth-vault-rule.md.
"""

from datetime import datetime, timezone
from typing import List, Optional, Union
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class StrictBaseModel(BaseModel):
    """Base model enforcing strict whitespace stripping and forbidding unexpected fields."""
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
        populate_by_name=True,
    )


class Basics(StrictBaseModel):
    """Core biographical, contact, and presence data."""
    full_name: str = Field(..., min_length=1, description="Candidate full legal/professional name")
    email: EmailStr = Field(..., description="Primary reachable email address")
    phone: str = Field(..., min_length=5, description="Contact phone number with country/area code")
    location: str = Field(..., min_length=1, description="City, State/Province, Country")
    linkedin_url: Optional[str] = Field(default=None, description="LinkedIn profile URL")
    github_username: Optional[str] = Field(default=None, description="GitHub handle or URL")
    portfolio_url: Optional[str] = Field(default=None, description="Personal website or portfolio URL")
    summary: Optional[str] = Field(default=None, description="Professional summary strictly grounded in vault facts")


class Education(StrictBaseModel):
    """Academic credentials, graduation timelines, and eligibility metrics."""
    institution: str = Field(..., min_length=1, description="University, College, or School name")
    degree: str = Field(..., min_length=1, description="Degree or certificate title (e.g., B.Tech)")
    field_of_study: str = Field(..., min_length=1, description="Major/Branch (e.g., Computer Science and Engineering)")
    start_date: str = Field(..., min_length=1, description="Start date (YYYY-MM or YYYY)")
    end_date: Optional[str] = Field(default=None, description="Completion/Expected graduation date (YYYY-MM or YYYY)")
    cgpa_or_percentage: Optional[Union[float, str]] = Field(
        default=None,
        description="CGPA (scale of 10) or Percentage for eligibility filters (AICTE/NATS/NCS/PMIS)"
    )
    graduation_year: Optional[int] = Field(
        default=None,
        ge=1970,
        le=2050,
        description="Year of graduation for batch eligibility checks"
    )


class Experience(StrictBaseModel):
    """Verified professional experience, internships, or apprentice roles."""
    company: str = Field(..., min_length=1, description="Company or organization name")
    role: str = Field(..., min_length=1, description="Designation or job title")
    location: Optional[str] = Field(default=None, description="Location of the workplace or 'Remote'")
    start_date: str = Field(..., min_length=1, description="Role start date (YYYY-MM)")
    end_date: Optional[str] = Field(default=None, description="Role end date (YYYY-MM or 'Present')")
    is_current: bool = Field(default=False, description="Flag indicating currently ongoing role")
    highlights: List[str] = Field(
        default_factory=list,
        description="Verified achievement bullet points grounded in real outcomes"
    )
    tech_stack: List[str] = Field(
        default_factory=list,
        description="Technologies and frameworks actively used in this role"
    )


class Project(StrictBaseModel):
    """Verified technical projects and production deployments."""
    id: str = Field(..., min_length=1, description="Unique project slug or identifier")
    name: str = Field(..., min_length=1, description="Name of the project")
    tagline: Optional[str] = Field(default=None, description="One-line elevator pitch")
    description: str = Field(..., min_length=1, description="Comprehensive factual overview of the project")
    highlights: List[str] = Field(
        default_factory=list,
        description="Key implementation highlights and architectural contributions"
    )
    tech_stack: List[str] = Field(
        default_factory=list,
        description="Languages, libraries, databases, and tools employed"
    )
    repo_url: Optional[str] = Field(default=None, description="VCS repository URL (e.g., GitHub)")
    live_url: Optional[str] = Field(default=None, description="Live deployment or demo URL")
    metrics: List[str] = Field(
        default_factory=list,
        description="Verified quantitative results (e.g., latency, users, throughput)"
    )


class SkillCategory(StrictBaseModel):
    """Categorized technical and professional skill taxonomy."""
    category_name: str = Field(
        ...,
        min_length=1,
        description="Category title (e.g., 'Languages', 'Frameworks', 'Developer Tools')"
    )
    skills: List[str] = Field(
        default_factory=list,
        description="List of verified skills belonging to this category"
    )


class Certification(StrictBaseModel):
    """Verified industry certifications and licenses."""
    name: str = Field(..., min_length=1, description="Certification name")
    issuer: str = Field(..., min_length=1, description="Issuing organization or authority")
    issue_date: Optional[str] = Field(default=None, description="Date issued (YYYY-MM or YYYY)")
    credential_url: Optional[str] = Field(default=None, description="Verification link or badge URL")


class MasterTruthVault(StrictBaseModel):
    """Root model for the immutable Master Truth Vault."""
    version: str = Field(default="1.0", description="Truth vault schema version")
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the latest vault revision"
    )
    basics: Basics = Field(..., description="Biographical, contact, and profile links")
    education: List[Education] = Field(
        default_factory=list,
        description="Educational credentials and eligibility criteria"
    )
    experience: List[Experience] = Field(
        default_factory=list,
        description="Verified work history and internships"
    )
    projects: List[Project] = Field(
        default_factory=list,
        description="Verified project portfolio and metrics"
    )
    skills: List[SkillCategory] = Field(
        default_factory=list,
        description="Categorized technical competencies"
    )
    certifications: List[Certification] = Field(
        default_factory=list,
        description="Industry certifications and credentials"
    )
