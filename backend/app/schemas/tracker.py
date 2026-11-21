"""Pydantic v2 schemas for Application Tracker, Callback Analytics, and Feedback Loop.

Strictly complies with .agent/rules/truth-vault-rule.md.
"""

from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

ApplicationStatus = Literal["saved", "applied", "shortlisted", "interview", "rejected", "offer"]
ResumeStyleTag = Literal["metrics_heavy", "project_first", "skills_first", "concise_startup", "formal_govt"]


class StrictTrackerBase(BaseModel):
    """Base model enforcing strict validation with whitespace stripping and forbidding unexpected fields."""
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )


class ApplicationCreateRequest(StrictTrackerBase):
    """Payload to log a new tailored job application."""
    user_id: str = Field(..., min_length=1, description="Candidate user identifier")
    company_name: str = Field(..., min_length=1, description="Company or hiring organization")
    role_title: str = Field(..., min_length=1, description="Target job title / designation")
    detected_portal: str = Field(default="unknown", description="Normalized portal slug (e.g. internshala, wellfound)")
    source_url: Optional[str] = Field(default=None, description="Job posting or application URL")
    ats_score: int = Field(..., ge=0, le=100, description="ATS match score computed by ATS Critic")
    style_tag: ResumeStyleTag = Field(default="metrics_heavy", description="Resume synthesis style used")
    selected_project_ids: List[str] = Field(
        default_factory=list,
        description="Truth Vault project IDs selected for this application"
    )
    status: ApplicationStatus = Field(default="applied", description="Current application lifecycle status")
    notes: Optional[str] = Field(default=None, description="Candidate notes, recruiter details, or interview log")


class ApplicationRecord(ApplicationCreateRequest):
    """Persisted application record with system metadata."""
    application_id: str = Field(..., min_length=1, description="Unique UUID for this application record")
    created_at: str = Field(..., description="ISO-8601 UTC timestamp of creation")
    updated_at: str = Field(..., description="ISO-8601 UTC timestamp of last status update")


class ApplicationStatusUpdateRequest(StrictTrackerBase):
    """Payload for updating an application's lifecycle status."""
    status: ApplicationStatus = Field(..., description="Updated application status")
    notes: Optional[str] = Field(default=None, description="Optional updated or appended notes")


class StylePerformanceMetric(StrictTrackerBase):
    """Aggregated callback and ATS score performance for a specific resume style."""
    style_tag: ResumeStyleTag = Field(..., description="Resume synthesis style archetype")
    total_applications: int = Field(..., ge=0, description="Total applications submitted with this style")
    positive_callbacks: int = Field(..., ge=0, description="Count of positive callbacks (shortlisted, interview, offer)")
    callback_rate_pct: float = Field(..., ge=0.0, le=100.0, description="Percentage conversion rate")
    avg_ats_score: float = Field(..., ge=0.0, le=100.0, description="Average ATS score for this style")


class TrackerAnalyticsResponse(StrictTrackerBase):
    """Comprehensive callback analytics and self-learning feedback loop insights."""
    user_id: str = Field(..., description="Candidate user identifier")
    total_applications: int = Field(..., ge=0, description="Total applications tracked across all stages")
    status_breakdown: Dict[str, int] = Field(default_factory=dict, description="Distribution across application statuses")
    portal_breakdown: Dict[str, int] = Field(default_factory=dict, description="Distribution across job portals")
    overall_callback_rate_pct: float = Field(..., ge=0.0, le=100.0, description="Overall callback conversion rate")
    avg_ats_score: float = Field(..., ge=0.0, le=100.0, description="Average ATS score across all applications")
    style_performance: List[StylePerformanceMetric] = Field(
        default_factory=list,
        description="Ranked performance of resume synthesis styles"
    )
    recommended_style_tag: Optional[ResumeStyleTag] = Field(
        default=None,
        description="Data-backed recommended resume style based on highest positive callbacks"
    )
    feedback_insights: List[str] = Field(
        default_factory=list,
        description="Data-driven feedback insights to prioritize styles and top-converting projects in future runs"
    )
