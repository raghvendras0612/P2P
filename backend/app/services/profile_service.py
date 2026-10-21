from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.catalog import (
    CareerPath,
    Interest,
    Skill,
    UserInterest,
    UserSelectedPath,
    UserSkill,
)
from app.models.profile import EducationEntry, Experience, Project, StudentProfile
from app.models.simulation import Simulation
from app.models.user import User
from app.schemas.catalog import CareerPathRead, InterestRead
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
    StudentProfileRead,
    StudentProfileUpdate,
    UserSkillClaimInput,
    UserSkillRead,
)
from app.schemas.simulation import SimulatedPath


def get_full_student_profile(db: Session, user: User) -> FullProfileRead:
    """Fetch all profile sections for the authenticated user."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    education_entries = (
        db.query(EducationEntry)
        .filter(EducationEntry.user_id == user.id)
        .order_by(EducationEntry.passing_year.desc())
        .all()
    )
    user_skills_raw = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()
    user_skills = []
    for us in user_skills_raw:
        skill = db.query(Skill).filter(Skill.id == us.skill_id).first()
        user_skills.append(
            UserSkillRead(
                id=us.id,
                skill_id=us.skill_id,
                skill_name=skill.name if skill else "Unknown",
                category=skill.category if skill else "Other",
                self_level=us.self_level,
                status=us.status,
                verified_level=us.verified_level,
                last_tested_at=us.last_tested_at,
            )
        )

    user_interests_raw = db.query(UserInterest).filter(UserInterest.user_id == user.id).all()
    interests = []
    for ui in user_interests_raw:
        interest = db.query(Interest).filter(Interest.id == ui.interest_id).first()
        if interest:
            interests.append(
                InterestRead(
                    id=interest.id,
                    name=interest.name,
                    group=interest.group,
                )
            )

    projects = (
        db.query(Project).filter(Project.user_id == user.id).order_by(Project.id.desc()).all()
    )
    experiences = (
        db.query(Experience)
        .filter(Experience.user_id == user.id)
        .order_by(Experience.id.desc())
        .all()
    )

    # Selected Career Path
    active_selection = (
        db.query(UserSelectedPath)
        .filter(
            UserSelectedPath.user_id == user.id,
            UserSelectedPath.is_active.is_(True),
        )
        .order_by(UserSelectedPath.selected_at.desc())
        .first()
    )
    selected_path = None
    if active_selection:
        cp = db.query(CareerPath).filter(CareerPath.id == active_selection.career_path_id).first()
        if cp:
            selected_path = CareerPathRead.model_validate(cp)

    return FullProfileRead(
        user_id=user.id,
        email=user.email,
        profile=StudentProfileRead.model_validate(profile) if profile else None,
        education=[EducationRead.model_validate(e) for e in education_entries],
        skills=user_skills,
        interests=interests,
        projects=[ProjectRead.model_validate(p) for p in projects],
        experiences=[ExperienceRead.model_validate(exp) for exp in experiences],
        selected_path=selected_path,
    )


def update_student_profile(
    db: Session, user: User, update_data: StudentProfileUpdate
) -> StudentProfileRead:
    """Update primary student profile details."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found.",
        )

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return StudentProfileRead.model_validate(profile)


def replace_user_skills(
    db: Session, user: User, skills_data: List[UserSkillClaimInput]
) -> List[UserSkillRead]:
    """Replace all claimed skills for the student with a new set."""
    # Delete existing user skills
    db.query(UserSkill).filter(UserSkill.user_id == user.id).delete()

    for item in skills_data:
        target_skill_id = item.skill_id
        if not target_skill_id and item.custom_skill_name:
            custom_name = item.custom_skill_name.strip()
            existing_skill = db.query(Skill).filter(Skill.name.ilike(custom_name)).first()
            if existing_skill:
                target_skill_id = existing_skill.id
            else:
                new_skill = Skill(
                    name=custom_name,
                    category=item.category or "Other",
                    is_verified_seed=False,
                )
                db.add(new_skill)
                db.flush()
                target_skill_id = new_skill.id

        if target_skill_id:
            db.add(
                UserSkill(
                    user_id=user.id,
                    skill_id=target_skill_id,
                    self_level=item.self_level,
                    status="claimed",
                )
            )

    db.commit()
    full_profile = get_full_student_profile(db, user)
    return full_profile.skills


def replace_user_interests(db: Session, user: User, interest_ids: List[int]) -> List[InterestRead]:
    """Replace student interests with the given set."""
    db.query(UserInterest).filter(UserInterest.user_id == user.id).delete()
    unique_ids = set(interest_ids)
    for i_id in unique_ids:
        interest_exists = db.query(Interest).filter(Interest.id == i_id).first()
        if interest_exists:
            db.add(UserInterest(user_id=user.id, interest_id=i_id))

    db.commit()
    full_profile = get_full_student_profile(db, user)
    return full_profile.interests


# Education CRUD
def add_education_entry(db: Session, user: User, data: EducationCreate) -> EducationRead:
    entry = EducationEntry(user_id=user.id, **data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return EducationRead.model_validate(entry)


def delete_education_entry(db: Session, user: User, entry_id: int) -> None:
    entry = (
        db.query(EducationEntry)
        .filter(EducationEntry.id == entry_id, EducationEntry.user_id == user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Education record not found.")
    db.delete(entry)
    db.commit()


# Project CRUD
def add_project(db: Session, user: User, data: ProjectCreate) -> ProjectRead:
    proj = Project(user_id=user.id, **data.model_dump())
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return ProjectRead.model_validate(proj)


def update_project(db: Session, user: User, project_id: int, data: ProjectUpdate) -> ProjectRead:
    proj = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(proj, field, value)
    db.commit()
    db.refresh(proj)
    return ProjectRead.model_validate(proj)


def delete_project(db: Session, user: User, project_id: int) -> None:
    proj = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")
    db.delete(proj)
    db.commit()


# Experience CRUD
def add_experience(db: Session, user: User, data: ExperienceCreate) -> ExperienceRead:
    exp = Experience(user_id=user.id, **data.model_dump())
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return ExperienceRead.model_validate(exp)


def update_experience(
    db: Session, user: User, experience_id: int, data: ExperienceUpdate
) -> ExperienceRead:
    exp = (
        db.query(Experience)
        .filter(Experience.id == experience_id, Experience.user_id == user.id)
        .first()
    )
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(exp, field, value)
    db.commit()
    db.refresh(exp)
    return ExperienceRead.model_validate(exp)


def delete_experience(db: Session, user: User, experience_id: int) -> None:
    exp = (
        db.query(Experience)
        .filter(Experience.id == experience_id, Experience.user_id == user.id)
        .first()
    )
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found.")
    db.delete(exp)
    db.commit()


# Selected Career Path Management
def select_career_path(
    db: Session, user: User, path_slug: str, simulation_id: Optional[int] = None
) -> SelectedPathDetailRead:
    """Select a career path for the student, optionally linking to a simulation."""
    # 1. Validate career path exists in catalog
    career_path = db.query(CareerPath).filter(CareerPath.slug == path_slug).first()
    if not career_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career path with slug '{path_slug}' not found in catalog.",
        )

    # 2. If simulation_id is provided, validate it belongs to this student and contains the path
    simulated_path: Optional[SimulatedPath] = None
    if simulation_id is not None:
        simulation = (
            db.query(Simulation)
            .filter(Simulation.id == simulation_id, Simulation.user_id == user.id)
            .first()
        )
        if not simulation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID {simulation_id} not found.",
            )

        paths = simulation.output_json.get("paths", [])
        matched = next((p for p in paths if p.get("path_slug") == path_slug), None)
        if not matched:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Simulation {simulation_id} does not contain path '{path_slug}'.",
            )
        simulated_path = SimulatedPath.model_validate(matched)

    # 3. Deactivate previous active selections (preserving audit history)
    db.query(UserSelectedPath).filter(
        UserSelectedPath.user_id == user.id,
        UserSelectedPath.is_active.is_(True),
    ).update({"is_active": False})

    # 4. Insert new active selection
    selection = UserSelectedPath(
        user_id=user.id,
        career_path_id=career_path.id,
        simulation_id=simulation_id,
        is_active=True,
    )
    db.add(selection)
    db.commit()
    db.refresh(selection)

    return SelectedPathDetailRead(
        id=selection.id,
        user_id=selection.user_id,
        career_path=CareerPathRead.model_validate(career_path),
        simulation_id=selection.simulation_id,
        selected_at=selection.selected_at,
        is_active=selection.is_active,
        simulated_path=simulated_path,
    )


def get_active_selected_path(db: Session, user: User) -> Optional[SelectedPathDetailRead]:
    """Retrieve the currently active selected path with its simulated projections if available."""
    selection = (
        db.query(UserSelectedPath)
        .filter(
            UserSelectedPath.user_id == user.id,
            UserSelectedPath.is_active.is_(True),
        )
        .order_by(UserSelectedPath.selected_at.desc())
        .first()
    )
    if not selection:
        return None

    career_path = db.query(CareerPath).filter(CareerPath.id == selection.career_path_id).first()
    if not career_path:
        return None

    simulated_path: Optional[SimulatedPath] = None
    if selection.simulation_id is not None:
        simulation = (
            db.query(Simulation)
            .filter(Simulation.id == selection.simulation_id, Simulation.user_id == user.id)
            .first()
        )
        if simulation:
            paths = simulation.output_json.get("paths", [])
            matched = next((p for p in paths if p.get("path_slug") == career_path.slug), None)
            if matched:
                try:
                    simulated_path = SimulatedPath.model_validate(matched)
                except Exception:
                    simulated_path = None

    return SelectedPathDetailRead(
        id=selection.id,
        user_id=selection.user_id,
        career_path=CareerPathRead.model_validate(career_path),
        simulation_id=selection.simulation_id,
        selected_at=selection.selected_at,
        is_active=selection.is_active,
        simulated_path=simulated_path,
    )


def unselect_career_path(db: Session, user: User) -> None:
    """Deactivate all active career path selections for the student."""
    db.query(UserSelectedPath).filter(
        UserSelectedPath.user_id == user.id,
        UserSelectedPath.is_active.is_(True),
    ).update({"is_active": False})
    db.commit()
