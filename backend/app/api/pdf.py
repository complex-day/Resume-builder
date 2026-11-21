"""PDF generation and verification API endpoints."""

from fastapi import APIRouter, HTTPException, Response
from app.schemas.pdf import PDFGenerateRequest
from app.services.pdf_generator import generate_ats_pdf, verify_ats_pdf_extractable

router = APIRouter(prefix="/api/v1/pdf", tags=["ATS PDF Engine"])


@router.post("/generate")
async def generate_pdf_endpoint(request: PDFGenerateRequest):
    """Generate and verify an ATS-proof single-column PDF resume.

    Strictly complies with .agent/rules/ats-pdf-rule.md.
    """
    try:
        pdf_bytes = generate_ats_pdf(vault=request.vault, tailored=request.tailored_resume)
        verification = verify_ats_pdf_extractable(
            pdf_bytes=pdf_bytes,
            vault=request.vault,
            tailored=request.tailored_resume,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"ATS PDF Verification Error: {str(exc)}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF: {str(exc)}"
        )

    headers = {
        "Content-Disposition": 'attachment; filename="tailored_resume.pdf"',
        "X-ATS-PDF-Verified": "true",
        "X-ATS-PDF-Pages": str(verification["page_count"]),
        "X-ATS-PDF-Chars": str(verification["extracted_char_count"]),
    }

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers=headers,
    )
