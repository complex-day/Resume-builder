"""PDF generation schemas."""

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.truth_vault import MasterTruthVault
from app.schemas.pipeline import TailoredResume


class PDFGenerateRequest(BaseModel):
    """Request payload for ATS PDF generation."""
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    vault: MasterTruthVault = Field(..., description="The candidate's Master Truth Vault")
    tailored_resume: TailoredResume = Field(..., description="Tailored resume data")
