"""Truth Vault API endpoints."""

from typing import Any, Dict
from fastapi import APIRouter, Query
from app.schemas.truth_vault import MasterTruthVault
from app.services.github_importer import fetch_github_projects

router = APIRouter(prefix="/api/v1/vault", tags=["Master Truth Vault"])


@router.post("/validate")
async def validate_vault(vault: MasterTruthVault):
    """Validate a Master Truth Vault JSON payload against strict Pydantic v2 schemas.

    Returns the validation status, project count, and total distinct skills count.
    """
    total_skills = sum(len(category.skills) for category in vault.skills)

    return {
        "status": "valid",
        "project_count": len(vault.projects),
        "skill_count": total_skills,
    }


@router.get("/import/github/{username}")
async def import_github_projects(
    username: str,
    max_repos: int = Query(default=6, ge=1, le=20, description="Max non-forked repos to import")
) -> Dict[str, Any]:
    """Auto-import public non-forked GitHub repositories and map them to Project schemas.

    Strictly complies with zero-hallucination rules (highlights and metrics remain empty).
    """
    projects = await fetch_github_projects(username=username, max_repos=max_repos)

    return {
        "username": username,
        "imported_count": len(projects),
        "projects": projects,
    }
