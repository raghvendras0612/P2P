from typing import List

from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.catalog import InterestRead
from app.schemas.profile import (
    EducationCreate,
    EducationRead,
    ExperienceCreate,
    ExperienceRead,
    ExperienceUpdate,
    FullProfileRead,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
    SelectedPathDetailRead,
    SelectedPathResponse,
    SelectPathRequest,
    StudentProfileRead,
    StudentProfileUpdate,
    UserInterestInput,
    UserSkillClaimInput,
    UserSkillRead,
)
from app.services import profile_service

router = APIRouter(prefix="/profile", tags=["Student Profile"])


@router.get("", response_model=FullProfileRead)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full student profile including education, skills, interests, projects, and experiences."""
    return profile_service.get_full_student_profile(db, current_user)


@router.put("", response_model=StudentProfileRead)
def update_my_profile(
    update_data: StudentProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update primary student profile attributes."""
    return profile_service.update_student_profile(db, current_user, update_data)


@router.put("/skills", response_model=List[UserSkillRead])
def update_my_skills(
    skills_data: List[UserSkillClaimInput],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update or replace claimed technical skills with self-rated proficiency levels."""
    return profile_service.replace_user_skills(db, current_user, skills_data)


@router.put("/interests", response_model=List[InterestRead])
def update_my_interests(
    interest_data: UserInterestInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update selected career interest areas."""
    return profile_service.replace_user_interests(db, current_user, interest_data.interest_ids)


# --- Education ---
@router.post("/education", response_model=EducationRead, status_code=status.HTTP_201_CREATED)
def add_education(
    edu_data: EducationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new education record."""
    return profile_service.add_education_entry(db, current_user, edu_data)


@router.delete("/education/{education_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(
    education_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an education record."""
    profile_service.delete_education_entry(db, current_user, education_id)
    return None


# --- Projects ---
@router.post("/projects", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def add_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a project to the profile."""
    return profile_service.add_project(db, current_user, project_data)


@router.put("/projects/{project_id}", response_model=ProjectRead)
def update_project(
    project_data: ProjectUpdate,
    project_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an existing project."""
    return profile_service.update_project(db, current_user, project_id, project_data)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a project from the profile."""
    profile_service.delete_project(db, current_user, project_id)
    return None


# --- Experiences ---
@router.post("/experiences", response_model=ExperienceRead, status_code=status.HTTP_201_CREATED)
def add_experience(
    exp_data: ExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add an internship, hackathon, certification, or achievement."""
    return profile_service.add_experience(db, current_user, exp_data)


@router.put("/experiences/{experience_id}", response_model=ExperienceRead)
def update_experience(
    exp_data: ExperienceUpdate,
    experience_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an experience entry."""
    return profile_service.update_experience(db, current_user, experience_id, exp_data)


@router.delete("/experiences/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(
    experience_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an experience entry."""
    profile_service.delete_experience(db, current_user, experience_id)
    return None


# --- Career Path Selection & Personalization ---
@router.post("/selected-path", response_model=SelectedPathDetailRead)
def set_selected_path(
    payload: SelectPathRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Select a career path for the student, optionally binding it to a simulation run."""
    return profile_service.select_career_path(
        db=db,
        user=current_user,
        path_slug=payload.path_slug,
        simulation_id=payload.simulation_id,
    )


@router.get("/selected-path", response_model=SelectedPathResponse)
def get_selected_path(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the student's currently active selected career path and its simulated track."""
    path = profile_service.get_active_selected_path(db=db, user=current_user)
    return SelectedPathResponse(selected_path=path)


@router.delete("/selected-path", status_code=status.HTTP_200_OK)
def clear_selected_path(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Unselect/clear the active career path for the student."""
    profile_service.unselect_career_path(db=db, user=current_user)
    return {"message": "Selected career path cleared successfully."}
