"""Pydantic v2 schemas for Vision JD Extractor and WhatsApp / Telegram Bot Webhook.

Strictly complies with .agent/rules/truth-vault-rule.md and ats-pdf-rule.md.
"""

from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

BotChannel = Literal["telegram", "whatsapp"]


class StrictBotBase(BaseModel):
    """Base model enforcing strict validation with whitespace stripping and forbidding unexpected fields."""
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )


class BotIncomingMessage(StrictBotBase):
    """Incoming webhook payload from Telegram bot or WhatsApp Cloud API / Twilio gateway."""
    channel: BotChannel = Field(..., description="Messaging channel (telegram or whatsapp)")
    user_id: str = Field(..., min_length=1, description="Candidate user identifier mapping to Truth Vault")
    chat_id: str = Field(..., min_length=1, description="Telegram chat_id or WhatsApp sender phone/user ID")
    message_text: Optional[str] = Field(default=None, description="Raw job description text or job URL")
    source_url: Optional[str] = Field(default=None, description="Optional job posting URL")
    image_base64: Optional[str] = Field(default=None, description="Base64-encoded image of job posting screenshot")
    image_mime_type: Optional[Literal["image/png", "image/jpeg", "image/webp"]] = Field(
        default=None,
        description="MIME type of screenshot (image/png, image/jpeg, or image/webp)"
    )


class VisionExtractRequest(StrictBotBase):
    """Request payload for standalone Vision JD screenshot transcription."""
    image_base64: str = Field(..., min_length=1, description="Base64-encoded image string")
    image_mime_type: Literal["image/png", "image/jpeg", "image/webp"] = Field(
        default="image/png",
        description="MIME type of the screenshot"
    )


class VisionExtractResponse(StrictBotBase):
    """Output from Vision model transcribing visible job description text."""
    extracted_jd_text: str = Field(..., description="Verbatim visible job description text")
    detected_company: Optional[str] = Field(default=None, description="Hiring company if visible on screenshot")
    detected_role: Optional[str] = Field(default=None, description="Role title if visible on screenshot")
    char_count: int = Field(..., ge=0, description="Total characters extracted")


class BotReplyResponse(StrictBotBase):
    """Formatted mobile reply response delivered back to candidate."""
    channel: BotChannel = Field(..., description="Target messaging channel")
    chat_id: str = Field(..., description="Destination chat_id or sender phone")
    status: Literal["success", "needs_more_info", "vault_not_found"] = Field(
        ...,
        description="Outcome of processing: 'success', 'needs_more_info', or 'vault_not_found'"
    )
    reply_text: str = Field(..., description="Markdown-formatted message ready for mobile delivery")
    ats_score: Optional[int] = Field(default=None, ge=0, le=100, description="Tailored ATS match score")
    detected_portal: Optional[str] = Field(default=None, description="Normalized portal name")
    pdf_filename: Optional[str] = Field(default=None, description="Attachment filename for PDF resume")
    pdf_base64: Optional[str] = Field(default=None, description="Base64-encoded verified ATS-proof PDF bytes")
    pdf_verified: bool = Field(default=False, description="Verification flag confirming text is pypdf extractable")
