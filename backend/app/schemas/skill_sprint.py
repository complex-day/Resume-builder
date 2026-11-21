"""Pydantic v2 schemas for 48-Hour Proof-of-Work Skill Sprint.

Computes deterministic skill gaps against target JDs and structures a weekend mini-project
with Day 1/Day 2 milestones and 10 targeted interview prep questions.
Strictly complies with .agent/rules/truth-vault-rule.md.
"""

from typing import List, Literal
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.truth_vault import MasterTruthVault
from app.schemas.pipeline import DecodedJD


class StrictSkillSprintBase(BaseModel):
    """Base model enforcing zero-hallucination validation with strict whitespace stripping."""
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )


class SkillGapSummary(StrictSkillSprintBase):
    """Deterministic comparison between candidate Master Truth Vault and target JD."""
    existing_matching_skills: List[str] = Field(
        default_factory=list,
        description="Skills verified in candidate Truth Vault that directly match JD requirements"
    )
    missing_must_have_skills: List[str] = Field(
        default_factory=list,
        description="Mandatory skills from JD not found in candidate Truth Vault"
    )
    missing_nice_to_have_skills: List[str] = Field(
        default_factory=list,
        description="Bonus/secondary skills from JD not found in candidate Truth Vault"
    )


class WeekendMiniProject(StrictSkillSprintBase):
    """Realistic 48-hour scoped proof-of-work project to close skill gaps."""
    title: str = Field(..., min_length=1, description="Concise, technical title of the mini-project")
    target_skills: List[str] = Field(
        ...,
        min_length=1,
        description="Core skills this project demonstrates (focusing on closing gaps or deepening competencies)"
    )
    problem_statement: str = Field(..., min_length=1, description="Realistic engineering problem to solve")
    tech_stack: List[str] = Field(..., min_length=1, description="Technologies, libraries, and frameworks used")
    day_1_milestones: List[str] = Field(
        ...,
        min_length=2,
        max_length=5,
        description="2 to 4 concrete implementation tasks for Saturday (architecture, scaffolding, core logic)"
    )
    day_2_milestones: List[str] = Field(
        ...,
        min_length=2,
        max_length=5,
        description="2 to 4 concrete tasks for Sunday (integration tests, README, live demo, GitHub push)"
    )
    post_completion_resume_bullet_template: str = Field(
        ...,
        min_length=1,
        description="Draft STAR/XYZ resume bullet to add to Truth Vault ONLY after building and pushing code"
    )


class TargetedInterviewQuestion(StrictSkillSprintBase):
    """Targeted technical or project deep-dive interview question and answer guide."""
    question: str = Field(..., min_length=1, description="Interview question likely to be asked for this JD")
    category: Literal["technical", "system_design", "project_deep_dive", "behavioral"] = Field(
        ...,
        description="Interview question classification"
    )
    why_asked: str = Field(..., min_length=1, description="Interviewer intent behind the question")
    crisp_answer_guide: str = Field(
        ...,
        min_length=1,
        description="Crisp factual guide grounded in candidate's real background and JD requirements"
    )


class SkillSprintPlan(StrictSkillSprintBase):
    """Comprehensive 48-Hour Skill Sprint and Interview Preparation Plan."""
    role_title: str = Field(..., min_length=1, description="Target job title from decoded JD")
    skill_gap: SkillGapSummary = Field(..., description="Deterministic skill gap analysis")
    mini_project: WeekendMiniProject = Field(..., description="Actionable 48-hour proof-of-work project")
    interview_questions: List[TargetedInterviewQuestion] = Field(
        ...,
        min_length=10,
        max_length=10,
        description="Exactly 10 targeted interview questions spanning technical, system design, projects, and behavioral"
    )
    truth_vault_reminder: str = Field(
        ...,
        description="Explicit rule reminder forbidding vault modification until code is built and pushed"
    )


class SkillSprintRequest(StrictSkillSprintBase):
    """Request payload for Skill Sprint generation."""
    vault: MasterTruthVault = Field(..., description="The candidate's Master Truth Vault")
    decoded_jd: DecodedJD = Field(..., description="The decoded target job description")
