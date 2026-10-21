from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.resume import (
    ResumeCompiledData,
    TailorResumeRequest,
    TailorResumeResponse,
    UpdateResumeSettingsRequest,
)
from app.services.resume_service import resume_service

router = APIRouter(prefix="/resume", tags=["ATS Resume Builder"])


@router.get("", response_model=ResumeCompiledData)
def get_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve compiled ATS resume data, template configuration, and resume strength checklist."""
    return resume_service.compile_resume(db=db, user=current_user)


@router.put("", response_model=ResumeCompiledData)
@router.put("/settings", response_model=ResumeCompiledData)
def update_resume_settings(
    payload: UpdateResumeSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update resume template preference, target role, custom summary, or unverified skills visibility."""
    return resume_service.update_resume_settings(db=db, user=current_user, payload=payload)


@router.post("/tailor", response_model=TailorResumeResponse)
def tailor_resume_for_track(
    payload: TailorResumeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Use AI to generate an ATS-optimized professional summary and rank projects for the chosen career path."""
    return resume_service.tailor_resume_for_path(
        db=db,
        user=current_user,
        career_path_slug=payload.career_path_slug,
    )


@router.get("/export/pdf")
def export_resume_pdf(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download an ATS-optimized single-column PDF resume generated server-side."""
    pdf_bytes = resume_service.export_pdf(db=db, user=current_user)
    filename = f"Resume_{current_user.profile.full_name.replace(' ', '_') if current_user.profile else 'Student'}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@router.get("/export/markdown")
def export_resume_markdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download clean Markdown version of the resume."""
    md_content = resume_service.export_markdown(db=db, user=current_user)
    filename = f"Resume_{current_user.profile.full_name.replace(' ', '_') if current_user.profile else 'Student'}.md"

    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@router.get("/export/json")
def export_resume_json(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download standardized JSON representation of the resume."""
    data = resume_service.compile_resume(db=db, user=current_user)
    filename = f"Resume_{current_user.profile.full_name.replace(' ', '_') if current_user.profile else 'Student'}.json"

    return Response(
        content=data.model_dump_json(indent=2),
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
