"""API endpoints for 48-Hour Proof-of-Work Skill Sprint and Interview Preparation."""

from fastapi import APIRouter
from app.schemas.skill_sprint import SkillSprintPlan, SkillSprintRequest
from app.agents.skill_sprint import generate_skill_sprint

router = APIRouter(prefix="/api/v1/skill-sprint", tags=["48-Hour Skill Sprint"])


@router.post("/generate", response_model=SkillSprintPlan)
async def generate_skill_sprint_endpoint(request: SkillSprintRequest) -> SkillSprintPlan:
    """Deterministically analyze skill gap and synthesize a weekend proof-of-work project with interview guide.

    Strictly complies with .agent/rules/truth-vault-rule.md.
    """
    return await generate_skill_sprint(request=request)
