"""Vision JD Screenshot Extractor Agent.

Transcribes visible job description text from screenshot images (PNG, JPEG, WebP)
using Gemini Vision models without summarizing or fabricating requirements.
"""

import asyncio
import base64
import os
from typing import Any, Optional
from dotenv import load_dotenv
from fastapi import HTTPException

from app.schemas.bot import VisionExtractResponse

load_dotenv()

# Module-level override hook for deterministic testing without external API calls
default_llm_override: Optional[Any] = None

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


async def extract_jd_from_image(
    image_base64: str,
    mime_type: str = "image/png",
    llm_override: Optional[Any] = None,
) -> VisionExtractResponse:
    """Validate image payload and transcribe visible JD text from screenshot image."""
    clean_b64 = (image_base64 or "").strip()
    if "base64," in clean_b64:
        clean_b64 = clean_b64.split("base64,")[1].strip()

    if not clean_b64:
        raise HTTPException(status_code=400, detail="Empty base64 image data provided.")

    try:
        decoded_bytes = base64.b64decode(clean_b64, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 encoding for image.")

    if len(decoded_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image size ({len(decoded_bytes)} bytes) exceeds maximum limit of 5 MB."
        )

    active_override = llm_override or default_llm_override

    if active_override is not None:
        # Fast deterministic path for offline testing
        if callable(active_override):
            result = active_override(clean_b64, mime_type)
        elif hasattr(active_override, "ainvoke"):
            result = await active_override.ainvoke(clean_b64)
        elif hasattr(active_override, "invoke"):
            result = active_override.invoke(clean_b64)
        else:
            result = active_override

        if isinstance(result, VisionExtractResponse):
            resp = result
        elif isinstance(result, dict):
            resp = VisionExtractResponse.model_validate(result)
        else:
            raise ValueError("Vision override output could not be converted to VisionExtractResponse")

        resp.char_count = len(resp.extracted_jd_text)
        return resp

    # Live Vision Call with Gemini
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.strip() == "" or api_key.startswith("your_"):
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured. Set GEMINI_API_KEY environment variable to enable live vision extraction."
        )

    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import HumanMessage

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    llm = ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=api_key,
        temperature=0.0,
        timeout=30.0,
    )
    structured_llm = llm.with_structured_output(VisionExtractResponse)

    message = HumanMessage(
        content=[
            {
                "type": "text",
                "text": (
                    "Transcribe all visible job description text from this screenshot verbatim.\n"
                    "Extract the job title, company name (if visible), and full job description requirements.\n"
                    "Do NOT summarize, invent, or add external skills. Extract only what is visibly present."
                ),
            },
            {
                "type": "image_url",
                "image_url": f"data:{mime_type};base64,{clean_b64}",
            },
        ]
    )

    try:
        response = await asyncio.wait_for(
            structured_llm.ainvoke([message]),
            timeout=30.0,
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Vision JD extraction timed out after 30 seconds."
        )

    if not isinstance(response, VisionExtractResponse):
        response = VisionExtractResponse.model_validate(response)

    response.char_count = len(response.extracted_jd_text)
    return response
