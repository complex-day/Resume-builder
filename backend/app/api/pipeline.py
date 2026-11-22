"""Pipeline API routes for multi-agent resume synthesis and analysis."""

from fastapi import APIRouter, HTTPException, Request
from app.limiter import limiter, get_rate_limit_str, is_rate_limit_exempt
from app.schemas.pipeline import (
    DecodedJD,
    JDDecodeRequest,
    PipelineRunRequest,
    PipelineRunResponse,
    TailoredResume,
    TailorResumeRequest,
)
from app.agents.jd_decoder import decode_jd
from app.agents.resume_architect import build_tailored_resume
from app.agents.orchestrator import run_resume_pipeline
from app.services.vault_store import get_vault_store

router = APIRouter(prefix="/api/v1/pipeline", tags=["Agentic Resume Pipeline"])


@router.post("/decode-jd", response_model=DecodedJD)
async def decode_job_description(request: JDDecodeRequest) -> DecodedJD:
    """Decode a raw job description into structured ATS keywords, skills, and constraints."""
    return await decode_jd(raw_jd_text=request.raw_jd_text, source_url=request.source_url)


@router.post("/tailor-resume", response_model=TailoredResume)
async def tailor_resume_endpoint(request: TailorResumeRequest) -> TailoredResume:
    """Synthesize a tailored, ATS-optimized resume from the user's Master Truth Vault.

    Strictly grounded in vault facts with zero hallucination.
    """
    try:
        tailored = await build_tailored_resume(
            vault=request.vault,
            decoded_jd=request.decoded_jd,
            critic_feedback=request.critic_feedback,
        )
        return tailored
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/run", response_model=PipelineRunResponse)
@limiter.limit(get_rate_limit_str, exempt_when=is_rate_limit_exempt)
async def run_pipeline_endpoint(
    request: Request,
    payload: PipelineRunRequest,
) -> PipelineRunResponse:
    """Execute the full 3-Agent LangGraph orchestration pipeline with automated retry loop.

    Requires either an inline 'vault' or a 'user_id' stored in the local vault store.
    """
    vault = payload.vault
    if vault is None:
        if not payload.user_id:
            raise HTTPException(
                status_code=422,
                detail="Either 'vault' (inline) or 'user_id' must be provided."
            )
        store = get_vault_store()
        vault = store.get_vault(payload.user_id)
        if not vault:
            raise HTTPException(
                status_code=404,
                detail=f"Vault not found for user '{payload.user_id}'."
            )

    return await run_resume_pipeline(
        vault=vault,
        raw_jd_text=payload.raw_jd_text,
        source_url=payload.source_url,
    )
