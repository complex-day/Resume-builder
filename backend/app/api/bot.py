"""API endpoints for Vision JD Screenshot Extractor and WhatsApp / Telegram Bot Webhook."""

import base64
import os
import re
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from app.limiter import limiter, get_rate_limit_str, is_rate_limit_exempt

from app.schemas.bot import (
    BotIncomingMessage,
    BotReplyResponse,
    VisionExtractRequest,
    VisionExtractResponse,
)
from app.agents.vision_jd import extract_jd_from_image
from app.agents.orchestrator import run_resume_pipeline
from app.services.pdf_generator import generate_ats_pdf, verify_ats_pdf_extractable
from app.services.vault_store import get_vault_store

router = APIRouter(prefix="/api/v1/bot", tags=["Vision Extractor & Bot Webhook"])


def verify_webhook_secret(
    x_bot_webhook_secret: Optional[str] = Header(None, alias="X-Bot-Webhook-Secret")
) -> None:
    """Verify webhook secret if BOT_WEBHOOK_SECRET is configured in environment."""
    configured_secret = os.getenv("BOT_WEBHOOK_SECRET")
    if configured_secret and configured_secret.strip():
        if not x_bot_webhook_secret or x_bot_webhook_secret.strip() != configured_secret.strip():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Missing or invalid X-Bot-Webhook-Secret header."
            )


@router.post("/extract-jd-image", response_model=VisionExtractResponse, dependencies=[Depends(verify_webhook_secret)])
async def extract_jd_image_endpoint(request: VisionExtractRequest) -> VisionExtractResponse:
    """Transcribe visible job description text from a screenshot."""
    return await extract_jd_from_image(
        image_base64=request.image_base64,
        mime_type=request.image_mime_type,
    )


@router.post("/webhook", response_model=BotReplyResponse, dependencies=[Depends(verify_webhook_secret)])
@limiter.limit(get_rate_limit_str, exempt_when=is_rate_limit_exempt)
async def bot_webhook_endpoint(
    request: Request,
    message: BotIncomingMessage,
) -> BotReplyResponse:
    """Main webhook receiver for WhatsApp Cloud API, Twilio, and Telegram bots.

    Extracts JD from text or screenshot, runs multi-agent resume tailoring,
    compiles verified ATS PDF, and returns formatted mobile reply collateral.
    """
    # 1. Fetch user's Master Truth Vault
    store = get_vault_store()
    vault = store.get_vault(message.user_id)
    if not vault:
        return BotReplyResponse(
            channel=message.channel,
            chat_id=message.chat_id,
            status="vault_not_found",
            reply_text=(
                f"👋 Hello! We couldn't find a Master Truth Vault for user ID '{message.user_id}'. "
                "Please configure and save your verified experience profile at http://localhost:8000 before tailoring resumes."
            ),
            pdf_verified=False,
        )

    # 2. Extract JD text from image screenshot or direct message
    if message.image_base64 and message.image_base64.strip():
        mime = message.image_mime_type or "image/png"
        vision_result = await extract_jd_from_image(
            image_base64=message.image_base64,
            mime_type=mime,
        )
        raw_jd_text = vision_result.extracted_jd_text
    elif message.message_text and message.message_text.strip():
        raw_jd_text = message.message_text
    else:
        raw_jd_text = ""

    clean_jd = raw_jd_text.strip()
    if len(clean_jd) < 50:
        return BotReplyResponse(
            channel=message.channel,
            chat_id=message.chat_id,
            status="needs_more_info",
            reply_text=(
                "⚠️ We received your message, but the job description text was too short (under 50 characters). "
                "Please send a clearer screenshot of the full job posting or paste the complete job description text."
            ),
            pdf_verified=False,
        )

    # 3. Execute 3-Agent LangGraph Pipeline
    pipeline_res = await run_resume_pipeline(
        vault=vault,
        raw_jd_text=clean_jd,
        source_url=message.source_url,
    )

    tailored = pipeline_res.tailored_resume
    critique = pipeline_res.ats_critique
    score = critique.score
    detected_portal = pipeline_res.decoded_jd.detected_portal

    # 4. Generate & Verify ATS-Proof PDF Resume
    pdf_bytes = generate_ats_pdf(vault=vault, tailored=tailored)
    verify_ats_pdf_extractable(pdf_bytes=pdf_bytes, vault=vault, tailored=tailored)
    pdf_base64_str = base64.b64encode(pdf_bytes).decode("utf-8")

    cand_slug = re.sub(r"[^a-zA-Z0-9_-]", "_", vault.basics.full_name)
    role_slug = re.sub(r"[^a-zA-Z0-9_-]", "_", tailored.target_role)
    pdf_filename = f"{cand_slug}_{role_slug}_ATS.pdf"

    # 5. Format Mobile-Friendly Markdown Message
    matched_str = ", ".join(critique.matched_keywords[:5]) or "None"
    missing_str = ", ".join(critique.missing_must_have_skills[:3]) or "None"
    status_badge = "Passed ✓" if score >= 85 else "Best Effort ⚠"

    reply_text = (
        f"🎯 *ATS Resume Tailored Successfully!*\n\n"
        f"📋 *Role:* {tailored.target_role}\n"
        f"📊 *ATS Score:* {score}/100 ({status_badge})\n"
        f"🔄 *Attempts:* {pipeline_res.attempts}\n"
        f"✅ *Matched Skills:* {matched_str}\n"
        f"⚠️ *Missing Skills:* {missing_str}\n\n"
        f"📄 Your verified ATS-compliant PDF resume is attached below."
    )

    return BotReplyResponse(
        channel=message.channel,
        chat_id=message.chat_id,
        status="success",
        reply_text=reply_text,
        ats_score=score,
        detected_portal=detected_portal,
        pdf_filename=pdf_filename,
        pdf_base64=pdf_base64_str,
        pdf_verified=True,
    )
