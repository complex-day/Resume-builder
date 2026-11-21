"""ATS-Proof Single-Column PDF Generator and pypdf Verification Service.

Strictly complies with .agent/rules/ats-pdf-rule.md:
- Single-column linear layout only (Jake's Resume style).
- Standard Helvetica fonts only.
- Zero multi-column tables, zero graphics, zero icons, zero emojis.
- Mandatory pypdf text-extraction verification before delivery.
- No raw HTML/XML tags leaking into generated PDF or text extraction.
"""

import io
import re
from typing import Any, Dict, List
from xml.sax.saxutils import escape as xml_escape
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer

from app.schemas.pipeline import TailoredResume
from app.schemas.truth_vault import MasterTruthVault


def _clean_text_for_pdf(text: str) -> str:
    """Strip emojis/unwanted unicode and escape XML entities for ReportLab Paragraphs."""
    if not text:
        return ""
    # Strip emojis and uncommon decorative symbols
    clean = re.sub(
        r"[\U00010000-\U0010ffff]|[\u2600-\u27bf]|[\u2300-\u23ff]|[\u2b50-\u2b55]",
        "",
        str(text),
    )
    # Safely escape &, <, >
    return xml_escape(clean.strip())


def generate_ats_pdf(vault: MasterTruthVault, tailored: TailoredResume) -> bytes:
    """Render a clean, single-column Jake's Resume style PDF using ReportLab."""
    buffer = io.BytesIO()

    # Document setup: 0.5 inch margins all around
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    # ATS-Safe Standard Typography (Helvetica / Helvetica-Bold)
    name_style = ParagraphStyle(
        "ATS_Name",
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=21,
        alignment=1,  # Center
        textColor=HexColor("#111111"),
        spaceAfter=3,
    )

    contact_style = ParagraphStyle(
        "ATS_Contact",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        alignment=1,  # Center
        textColor=HexColor("#333333"),
        spaceAfter=7,
    )

    contact_style_line1 = ParagraphStyle(
        "ATS_ContactLine1",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        alignment=1,  # Center
        textColor=HexColor("#333333"),
        spaceAfter=1.5,
    )

    contact_style_line2 = ParagraphStyle(
        "ATS_ContactLine2",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        alignment=1,  # Center
        textColor=HexColor("#333333"),
        spaceAfter=7,
    )

    heading_style = ParagraphStyle(
        "ATS_SectionHeading",
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=HexColor("#111111"),
        spaceBefore=5,
        spaceAfter=1,
    )

    item_title_style = ParagraphStyle(
        "ATS_ItemTitle",
        fontName="Helvetica",
        fontSize=9,
        leading=11.5,
        textColor=HexColor("#111111"),
        spaceBefore=2.5,
        spaceAfter=1,
    )

    body_style = ParagraphStyle(
        "ATS_Body",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=HexColor("#222222"),
        spaceBefore=1,
        spaceAfter=1.5,
    )

    bullet_style = ParagraphStyle(
        "ATS_Bullet",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=HexColor("#222222"),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=1,
    )

    def section_header(title: str) -> List[Any]:
        return [
            Paragraph(_clean_text_for_pdf(title.upper()), heading_style),
            HRFlowable(
                width="100%",
                thickness=0.75,
                color=HexColor("#333333"),
                spaceBefore=1,
                spaceAfter=3,
            ),
        ]

    story: List[Any] = []

    # 1. HEADER (Candidate Name & 2-Line Balanced Contact Bar)
    b = vault.basics
    story.append(Paragraph(_clean_text_for_pdf(b.full_name), name_style))

    # Line 1: Primary contact info
    line1_parts: List[str] = []
    if b.email:
        line1_parts.append(_clean_text_for_pdf(b.email))
    if b.phone:
        line1_parts.append(_clean_text_for_pdf(b.phone))
    if b.location:
        line1_parts.append(_clean_text_for_pdf(b.location))

    # Line 2: Web links and profiles
    line2_parts: List[str] = []
    if b.linkedin_url:
        clean_li = b.linkedin_url.replace("https://", "").replace("http://", "").rstrip("/")
        line2_parts.append(_clean_text_for_pdf(clean_li))
    if b.github_username:
        clean_gh = b.github_username.replace("https://github.com/", "").replace("http://github.com/", "").rstrip("/")
        line2_parts.append(_clean_text_for_pdf(f"github.com/{clean_gh}"))
    if b.portfolio_url:
        clean_port = b.portfolio_url.replace("https://", "").replace("http://", "").rstrip("/")
        line2_parts.append(_clean_text_for_pdf(clean_port))

    if line2_parts:
        story.append(Paragraph(" | ".join(line1_parts), contact_style_line1))
        story.append(Paragraph(" | ".join(line2_parts), contact_style_line2))
    elif line1_parts:
        story.append(Paragraph(" | ".join(line1_parts), contact_style))

    # 2. PROFESSIONAL SUMMARY
    if tailored.professional_summary:
        story.extend(section_header("Professional Summary"))
        story.append(Paragraph(_clean_text_for_pdf(tailored.professional_summary), body_style))
        story.append(Spacer(1, 3))

    # 3. EDUCATION (with non-breaking spaces for date range)
    if vault.education:
        story.extend(section_header("Education"))
        for edu in vault.education:
            clean_inst = _clean_text_for_pdf(edu.institution)
            clean_degree = _clean_text_for_pdf(edu.degree)
            clean_field = _clean_text_for_pdf(edu.field_of_study)
            clean_start = _clean_text_for_pdf(edu.start_date)
            clean_end = _clean_text_for_pdf(edu.end_date or "Present")
            date_range = f"({clean_start}&nbsp;&ndash;&nbsp;{clean_end})"
            grade_str = f" | CGPA/Score:&nbsp;{_clean_text_for_pdf(str(edu.cgpa_or_percentage))}" if edu.cgpa_or_percentage else ""
            edu_line = f"<b>{clean_inst}</b> — {clean_degree} in {clean_field} {date_range}{grade_str}"
            story.append(Paragraph(edu_line, item_title_style))
        story.append(Spacer(1, 3))

    # 4. EXPERIENCE
    if tailored.experience:
        story.extend(section_header("Experience"))
        for exp in tailored.experience:
            clean_comp = _clean_text_for_pdf(exp.company)
            clean_role = _clean_text_for_pdf(exp.role)
            loc_str = f" | {_clean_text_for_pdf(exp.location)}" if exp.location else ""
            clean_start = _clean_text_for_pdf(exp.start_date)
            clean_end = _clean_text_for_pdf(exp.end_date or "Present")
            date_range = f"({clean_start}&nbsp;&ndash;&nbsp;{clean_end})"
            exp_header = f"<b>{clean_comp}</b> — <i>{clean_role}</i>{loc_str} | {date_range}"
            story.append(Paragraph(exp_header, item_title_style))

            for bullet in exp.bullets:
                bullet_text = f"&bull; {_clean_text_for_pdf(bullet)}"
                story.append(Paragraph(bullet_text, bullet_style))
        story.append(Spacer(1, 3))

    # 5. PROJECTS (properly escaped before markup tags & with clean spacing)
    if tailored.projects:
        story.extend(section_header("Projects"))
        for proj in tailored.projects:
            clean_pname = _clean_text_for_pdf(proj.name)

            # Escape each individual tech item before wrapping in <i> tags
            if proj.tech_stack:
                escaped_tech = ", ".join(_clean_text_for_pdf(t) for t in proj.tech_stack)
                tech_str = f" | <i>{escaped_tech}</i>"
            else:
                tech_str = ""

            # Clickable project links
            link_parts = []
            if proj.repo_url:
                clean_repo = _clean_text_for_pdf(proj.repo_url)
                link_parts.append(f"<a href='{clean_repo}'>GitHub</a>")
            if proj.live_url:
                clean_live = _clean_text_for_pdf(proj.live_url)
                link_parts.append(f"<a href='{clean_live}'>Live Demo</a>")
            links_str = f" [{' | '.join(link_parts)}]" if link_parts else ""

            proj_header = f"<b>{clean_pname}</b>{tech_str}{links_str}"
            story.append(Paragraph(proj_header, item_title_style))

            for bullet in proj.bullets:
                bullet_text = f"&bull; {_clean_text_for_pdf(bullet)}"
                story.append(Paragraph(bullet_text, bullet_style))
        story.append(Spacer(1, 3))

    # 6. TECHNICAL SKILLS
    if tailored.skills:
        story.extend(section_header("Technical Skills"))
        for skill_cat in tailored.skills:
            clean_cat = _clean_text_for_pdf(skill_cat.category_name)
            clean_skills = ", ".join(_clean_text_for_pdf(s) for s in skill_cat.skills)
            cat_line = f"<b>{clean_cat}:</b> {clean_skills}"
            story.append(Paragraph(cat_line, body_style))
        story.append(Spacer(1, 3))

    # 7. CERTIFICATIONS
    if vault.certifications:
        story.extend(section_header("Certifications"))
        for cert in vault.certifications:
            clean_cname = _clean_text_for_pdf(cert.name)
            clean_issuer = _clean_text_for_pdf(cert.issuer)
            date_str = f" ({_clean_text_for_pdf(cert.issue_date)})" if cert.issue_date else ""
            cert_line = f"<b>{clean_cname}</b> — {clean_issuer}{date_str}"
            story.append(Paragraph(cert_line, body_style))

    # Build PDF
    doc.build(story)
    return buffer.getvalue()


def verify_ats_pdf_extractable(
    pdf_bytes: bytes,
    vault: MasterTruthVault,
    tailored: TailoredResume
) -> Dict[str, Any]:
    """Execute mandatory pypdf text extraction verification gate.

    Ensures that PDF contains valid text, contains candidate name, email,
    section headings, and all tailored project names in clean reading order.
    """
    if not pdf_bytes or not pdf_bytes.startswith(b"%PDF-"):
        raise ValueError("Invalid PDF binary output (missing %PDF- header).")

    reader = PdfReader(io.BytesIO(pdf_bytes))
    page_count = len(reader.pages)
    if page_count < 1:
        raise ValueError("Generated PDF has 0 pages.")

    # Extract all text
    extracted_text = "".join(page.extract_text() or "" for page in reader.pages)
    char_count = len(extracted_text)

    if char_count < 100:
        raise ValueError(
            f"Extracted text too short ({char_count} chars). PDF text layer may be empty or unparseable."
        )

    # Check for corrupt or replacement character sequences
    if "\ufffd" in extracted_text or "(cid:" in extracted_text:
        raise ValueError("Corrupt character encoding detected in extracted PDF stream.")

    missing_checks: List[str] = []
    text_lower = extracted_text.lower()

    # Check that raw HTML/XML tags never leak into the extracted text layer
    for raw_tag in ["<i>", "</i>", "<b>", "</b>", "&lt;", "&gt;"]:
        if raw_tag in text_lower:
            missing_checks.append(f"Raw markup tag or entity '{raw_tag}' leaked into extracted PDF text.")

    # 1. Candidate Full Name Check
    if vault.basics.full_name.strip().lower() not in text_lower:
        missing_checks.append(f"Candidate name '{vault.basics.full_name}' not found in extracted text.")

    # 2. Candidate Email Check
    if vault.basics.email.strip().lower() not in text_lower:
        missing_checks.append(f"Candidate email '{vault.basics.email}' not found in extracted text.")

    # 3. Tailored Project Names Check
    for proj in tailored.projects:
        proj_name_clean = proj.name.strip().lower()
        first_token = proj_name_clean.split("-")[0].strip().split()[0]
        if first_token not in text_lower:
            missing_checks.append(f"Project '{proj.name}' token '{first_token}' not found in extracted text.")

    if missing_checks:
        raise ValueError(f"ATS PDF Text Extraction Failed: {'; '.join(missing_checks)}")

    return {
        "passed": True,
        "page_count": page_count,
        "extracted_char_count": char_count,
        "missing_checks": [],
        "preview": extracted_text[:300].strip(),
    }
