"""API routes for Application Tracker, Status Lifecycle, and Feedback Analytics."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.tracker import (
    ApplicationCreateRequest,
    ApplicationRecord,
    ApplicationStatusUpdateRequest,
    TrackerAnalyticsResponse,
)
from app.services.tracker_store import get_tracker_store
from app.services.vault_store import validate_user_id

router = APIRouter(prefix="/api/v1/tracker", tags=["Application Tracker & Analytics"])


@router.post("/applications", response_model=ApplicationRecord, status_code=status.HTTP_201_CREATED)
async def create_application_endpoint(request: ApplicationCreateRequest) -> ApplicationRecord:
    """Log a newly tailored job application."""
    try:
        clean_user_id = validate_user_id(request.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    store = get_tracker_store()
    return store.create_application(user_id=clean_user_id, request=request)


@router.get("/{user_id}/applications", response_model=List[ApplicationRecord])
async def list_applications_endpoint(
    user_id: str,
    status: Optional[str] = Query(default=None, description="Optional application status filter"),
) -> List[ApplicationRecord]:
    """Retrieve all tracked applications for a candidate, ordered chronologically descending."""
    try:
        clean_user_id = validate_user_id(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    store = get_tracker_store()
    return store.list_applications(user_id=clean_user_id, status=status)


@router.get("/{user_id}/applications/{application_id}", response_model=ApplicationRecord)
async def get_application_endpoint(user_id: str, application_id: str) -> ApplicationRecord:
    """Fetch details of a specific application."""
    try:
        clean_user_id = validate_user_id(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    store = get_tracker_store()
    record = store.get_application(user_id=clean_user_id, application_id=application_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found for user '{clean_user_id}'."
        )
    return record


@router.patch("/{user_id}/applications/{application_id}", response_model=ApplicationRecord)
async def update_application_status_endpoint(
    user_id: str,
    application_id: str,
    update: ApplicationStatusUpdateRequest,
) -> ApplicationRecord:
    """Update lifecycle status and candidate notes for an application."""
    try:
        clean_user_id = validate_user_id(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    store = get_tracker_store()
    updated = store.update_status(user_id=clean_user_id, application_id=application_id, update=update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found for user '{clean_user_id}'."
        )
    return updated


@router.delete("/{user_id}/applications/{application_id}")
async def delete_application_endpoint(user_id: str, application_id: str):
    """Delete an application record."""
    try:
        clean_user_id = validate_user_id(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    store = get_tracker_store()
    deleted = store.delete_application(user_id=clean_user_id, application_id=application_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found for user '{clean_user_id}'."
        )
    return {"status": "deleted", "application_id": application_id}


@router.get("/{user_id}/analytics", response_model=TrackerAnalyticsResponse)
async def get_tracker_analytics_endpoint(user_id: str) -> TrackerAnalyticsResponse:
    """Compute callback conversion rates, rank resume styles, and generate data-driven feedback loop insights."""
    try:
        clean_user_id = validate_user_id(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    store = get_tracker_store()
    return store.compute_analytics_and_feedback(user_id=clean_user_id)
