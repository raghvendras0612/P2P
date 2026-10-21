from typing import List

from fastapi import APIRouter, Depends, Path, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.testing import (
    ActiveTestSessionRead,
    AnswerSubmitRequest,
    ClaimedSkillTestEligibility,
    TestResultResponse,
)
from app.services.test_engine_service import test_engine_service

router = APIRouter(prefix="/tests", tags=["Skill Diagnostic Tests"])


class StartTestRequest(BaseModel):
    skill_id: int = Field(..., ge=1, description="ID of claimed skill to test")


@router.get("/skills", response_model=List[ClaimedSkillTestEligibility])
def get_testable_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all skills claimed by the student with test readiness, active cooldowns, and career path priority."""
    return test_engine_service.get_claimed_skills_eligibility(db=db, user=current_user)


@router.post("/start", response_model=ActiveTestSessionRead)
def start_or_resume_test(
    payload: StartTestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start a new test session or resume an unexpired attempt. Zero answer keys or explanations are exposed."""
    return test_engine_service.start_or_resume_test(
        db=db,
        user=current_user,
        skill_id=payload.skill_id,
    )


@router.put("/{attempt_id}/answer", status_code=status.HTTP_200_OK)
def save_incremental_answer(
    payload: AnswerSubmitRequest,
    attempt_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Autosave selected answer choices incrementally to persist progress against page reload or network blips."""
    test_engine_service.record_incremental_answer(
        db=db,
        user=current_user,
        attempt_id=attempt_id,
        question_id=payload.question_id,
        selected_answers=payload.selected_answers,
        time_spent_seconds=payload.time_spent_seconds or 0,
    )
    return {"message": "Answer saved successfully."}


@router.post("/{attempt_id}/tab-switch", status_code=status.HTTP_200_OK)
def log_tab_switch(
    attempt_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log tab switch activity for proctoring audit (non-blocking)."""
    count = test_engine_service.record_tab_switch(
        db=db,
        user=current_user,
        attempt_id=attempt_id,
    )
    return {"message": "Tab switch logged.", "tab_switch_count": count}


@router.post("/{attempt_id}/submit", response_model=TestResultResponse)
def submit_and_grade_test(
    attempt_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Finalize attempt, grade questions, compute verified level, update user skill, and reveal full answer key."""
    return test_engine_service.submit_and_grade_test(
        db=db,
        user=current_user,
        attempt_id=attempt_id,
    )


@router.get("/{attempt_id}/results", response_model=TestResultResponse)
def get_test_results(
    attempt_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch completed test report card, subtopic accuracy, and full question explanations."""
    return test_engine_service.get_attempt_results(
        db=db,
        user=current_user,
        attempt_id=attempt_id,
    )
