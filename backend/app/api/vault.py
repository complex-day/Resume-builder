"""Truth Vault API endpoints."""

from typing import Any, Dict
from fastapi import APIRouter, HTTPException, Query
from app.schemas.truth_vault import MasterTruthVault
from app.services.github_importer import fetch_github_projects
from app.services.vault_store import get_vault_store, validate_user_id

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


@router.put("/{user_id}")
async def save_user_vault(user_id: str, vault: MasterTruthVault):
    """Persist or update a validated MasterTruthVault for a specific user."""
    try:
        clean_user_id = validate_user_id(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    store = get_vault_store()
    saved = store.save_vault(clean_user_id, vault)

    return {
        "status": "saved",
        "user_id": clean_user_id,
        "updated_at": saved.updated_at.isoformat(),
        "project_count": len(saved.projects),
        "vault": saved,
    }


@router.get("/{user_id}")
async def get_user_vault(user_id: str):
    """Retrieve the saved MasterTruthVault for a specific user."""
    try:
        clean_user_id = validate_user_id(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    store = get_vault_store()
    vault = store.get_vault(clean_user_id)
    if not vault:
        raise HTTPException(
            status_code=404,
            detail=f"Master Truth Vault not found for user '{clean_user_id}'."
        )

    return vault


@router.post("/{user_id}/sync-github/{username}")
async def sync_github_projects_to_vault(
    user_id: str,
    username: str,
    max_repos: int = Query(default=5, ge=1, le=20, description="Max non-forked repos to import and merge")
):
    """Fetch user's GitHub repositories and merge into their saved Master Truth Vault.

    Existing projects with matching IDs are preserved, and skipped_project_ids are reported (WC-5).
    """
    try:
        clean_user_id = validate_user_id(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    store = get_vault_store()
    existing_vault = store.get_vault(clean_user_id)
    if not existing_vault:
        raise HTTPException(
            status_code=404,
            detail=f"Vault not found for user '{clean_user_id}'. Please initialize vault first."
        )

    initial_count = len(existing_vault.projects)

    # Fetch GitHub repositories
    github_projects = await fetch_github_projects(username=username, max_repos=max_repos)

    # Merge into vault (returns tuple: updated_vault, skipped_project_ids)
    updated_vault, skipped_project_ids = store.merge_projects(clean_user_id, github_projects)
    total_projects = len(updated_vault.projects)
    newly_added_count = total_projects - initial_count

    return {
        "status": "synced",
        "user_id": clean_user_id,
        "username": username,
        "total_projects": total_projects,
        "newly_added_count": newly_added_count,
        "project_ids": [p.id for p in updated_vault.projects],
        "skipped_project_ids": skipped_project_ids,
    }
