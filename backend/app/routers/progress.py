from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.progress import (
    ProgressDashboardResponse,
    ProgressToggleRequest,
    ProjectProgressUpdateRequest,
    SkillGrowthDataPoint,
)
from app.services.progress_service import progress_service

router = APIRouter(prefix="/progress", tags=["Progress & Streak Tracking"])


@router.get("", response_model=ProgressDashboardResponse)
def get_progress_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve current career roadmap progress, daily activity streak, and next recommended action."""
    return progress_service.get_progress(db=db, user=current_user)


@router.post("/toggle", status_code=status.HTTP_200_OK)
def toggle_progress_item(
    payload: ProgressToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle completion status for a milestone checkpoint or kickoff task, updating daily streak."""
    progress_service.toggle_item(db=db, user=current_user, payload=payload)
    return {"message": "Progress item updated successfully."}


@router.post("/projects", status_code=status.HTTP_200_OK)
def update_project_progress(
    payload: ProjectProgressUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record status, notes, or GitHub repository link for a recommended career track project."""
    progress_service.update_project_progress(db=db, user=current_user, payload=payload)
    return {"message": "Project progress updated successfully."}


@router.get("/history", response_model=List[SkillGrowthDataPoint])
def get_skill_growth_timeline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch timeline of verified skills over time for the skill growth trajectory chart."""
    return progress_service.get_skill_growth_history(db=db, user=current_user)
