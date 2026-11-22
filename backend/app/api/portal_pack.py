"""API endpoints for Portal-Specific Application Pack and Eligibility Verification."""

from fastapi import APIRouter, Request
from app.limiter import limiter, get_rate_limit_str, is_rate_limit_exempt
from app.schemas.portal_pack import PortalApplicationPack, PortalPackRequest
from app.agents.portal_pack import generate_portal_pack

router = APIRouter(prefix="/api/v1/portal-pack", tags=["Portal Application Pack"])


@router.post("/generate", response_model=PortalApplicationPack)
@limiter.limit(get_rate_limit_str, exempt_when=is_rate_limit_exempt)
async def generate_portal_application_pack(
    request: Request,
    payload: PortalPackRequest,
) -> PortalApplicationPack:
    """Evaluate deterministic eligibility and synthesize portal-specific collateral.

    Strictly grounded in Master Truth Vault facts with zero hallucination.
    """
    return await generate_portal_pack(request=payload)
