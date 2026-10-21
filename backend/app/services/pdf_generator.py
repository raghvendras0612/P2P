import io
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)


def generate_ats_resume_pdf(data: Dict[str, Any], template_id: str = "minimal_ats") -> bytes:
    """Generate a clean, high-density, ATS-parsable PDF resume using ReportLab."""
    buffer = io.BytesIO()

    # ATS Best practice: 0.5 inch margins (36 points)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Template-specific color schemes
    if template_id == "modern_compact":
        primary_color = colors.HexColor("#0f766e")  # Teal 700
        dark_text = colors.HexColor("#0f172a")  # Slate 900
        muted_text = colors.HexColor("#475569")  # Slate 600
        divider_color = colors.HexColor("#0f766e")
    elif template_id == "classic_single":
        primary_color = colors.HexColor("#1e3a8a")  # Blue 900
        dark_text = colors.HexColor("#111827")  # Gray 900
        muted_text = colors.HexColor("#4b5563")  # Gray 600
        divider_color = colors.HexColor("#1e3a8a")
    else:  # minimal_ats
        primary_color = colors.HexColor("#18181b")  # Zinc 900
        dark_text = colors.HexColor("#18181b")
        muted_text = colors.HexColor("#52525b")  # Zinc 600
        divider_color = colors.HexColor("#27272a")

    # Typography styles
    name_style = ParagraphStyle(
        "ResumeName",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=dark_text,
        alignment=0,  # Left-aligned for ATS
    )

    role_style = ParagraphStyle(
        "ResumeRole",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=primary_color,
    )

    contact_style = ParagraphStyle(
        "ResumeContact",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=muted_text,
    )

    heading_style = ParagraphStyle(
        "ResumeHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=primary_color,
        spaceAfter=2,
    )

    body_style = ParagraphStyle(
        "ResumeBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=dark_text,
    )

    bullet_style = ParagraphStyle(
        "ResumeBullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=dark_text,
        leftIndent=12,
    )

    story: List[Any] = []

    # 1. Header: Name & Target Role
    story.append(Paragraph(data.get("full_name", "Student Name").upper(), name_style))
    if data.get("target_role"):
        story.append(Spacer(1, 2))
        story.append(Paragraph(data["target_role"], role_style))

    # Contact Info line
    contact_parts = []
    if data.get("email"):
        contact_parts.append(data["email"])
    if data.get("phone"):
        contact_parts.append(data["phone"])
    loc = f"{data.get('city', '')}, {data.get('state', '')}".strip(", ")
    if loc:
        contact_parts.append(loc)
    if data.get("linkedin_url"):
        contact_parts.append(f"LinkedIn: {data['linkedin_url']}")
    if data.get("github_url"):
        contact_parts.append(f"GitHub: {data['github_url']}")
    if data.get("portfolio_url"):
        contact_parts.append(f"Portfolio: {data['portfolio_url']}")

    contact_str = " | ".join(contact_parts)
    story.append(Spacer(1, 4))
    story.append(Paragraph(contact_str, contact_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=divider_color, spaceAfter=8))

    # 2. Professional Summary
    summary = data.get("summary")
    if summary:
        story.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
        story.append(
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#d1d5db"), spaceAfter=4)
        )
        story.append(Paragraph(summary, body_style))
        story.append(Spacer(1, 8))

    # 3. Technical Skills
    verified_skills = data.get("verified_skills", [])
    unverified_skills = data.get("unverified_skills", [])
    show_unverified = data.get("show_unverified_skills", True)

    if verified_skills or (show_unverified and unverified_skills):
        story.append(Paragraph("TECHNICAL SKILLS", heading_style))
        story.append(
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#d1d5db"), spaceAfter=4)
        )

        if verified_skills:
            # Group verified skills by level
            verified_strs = [
                f"<b>{s['name']}</b> [Verified - {s.get('verified_level_name', 'Proficient')}]"
                for s in verified_skills
            ]
            story.append(
                Paragraph(f"<b>Verified Competencies:</b> {', '.join(verified_strs)}", body_style)
            )

        if show_unverified and unverified_skills:
            unverified_strs = [s["name"] for s in unverified_skills]
            story.append(Spacer(1, 2))
            story.append(
                Paragraph(
                    f"<b>Familiar / Self-Reported:</b> {', '.join(unverified_strs)}", body_style
                )
            )

        story.append(Spacer(1, 8))

    # 4. Portfolio Projects
    projects = data.get("projects", [])
    if projects:
        story.append(Paragraph("PROJECTS", heading_style))
        story.append(
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#d1d5db"), spaceAfter=4)
        )

        for p in projects:
            title_text = f"<b>{p['title']}</b>"
            if p.get("link"):
                title_text += f" | <i>{p['link']}</i>"
            story.append(Paragraph(title_text, body_style))

            if p.get("tech_stack"):
                story.append(Paragraph(f"<i>Technologies: {p['tech_stack']}</i>", contact_style))

            if p.get("description"):
                desc = p["description"]
                story.append(Paragraph(f"&bull; {desc}", bullet_style))

            story.append(Spacer(1, 4))
        story.append(Spacer(1, 4))

    # 5. Experience / Hackathons / Achievements
    experiences = data.get("experiences", [])
    if experiences:
        story.append(Paragraph("EXPERIENCE & RECOGNITION", heading_style))
        story.append(
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#d1d5db"), spaceAfter=4)
        )

        for exp in experiences:
            exp_header = f"<b>{exp['title']}</b>"
            if exp.get("organization"):
                exp_header += f" &bull; {exp['organization']}"
            if exp.get("date_or_duration"):
                exp_header += f" ({exp['date_or_duration']})"
            story.append(Paragraph(exp_header, body_style))

            if exp.get("description"):
                story.append(Paragraph(f"&bull; {exp['description']}", bullet_style))
            story.append(Spacer(1, 4))
        story.append(Spacer(1, 4))

    # 6. Education
    education = data.get("education", [])
    if education:
        story.append(Paragraph("EDUCATION", heading_style))
        story.append(
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#d1d5db"), spaceAfter=4)
        )

        for edu in education:
            edu_line = f"<b>{edu['institution_name']}</b> | {edu['level']}"
            if edu.get("board_or_university"):
                edu_line += f" ({edu['board_or_university']})"
            story.append(Paragraph(edu_line, body_style))

            grade_line = f"Passing Year: {edu['passing_year']} | Score: {edu['percentage']}%"
            story.append(Paragraph(grade_line, contact_style))
            story.append(Spacer(1, 3))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
