from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.catalog import Interest, Skill, UserInterest, UserSkill
from app.models.profile import EducationEntry, Experience, Project, StudentProfile
from app.models.user import User
from app.schemas.auth import RegisterRequest


def register_student(db: Session, reg_data: RegisterRequest) -> User:
    """Register a user and their full onboarding profile in a single atomic transaction."""
    email_clean = reg_data.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    try:
        # 1. Create User
        password_hash = get_password_hash(reg_data.password)
        user = User(
            email=email_clean,
            password_hash=password_hash,
        )
        db.add(user)
        db.flush()  # Populates user.id

        # 2. Create Student Profile
        profile_data = reg_data.profile.model_dump()
        profile = StudentProfile(
            user_id=user.id,
            **profile_data,
        )
        db.add(profile)

        # 3. Add Education entries
        for edu_item in reg_data.education:
            edu = EducationEntry(
                user_id=user.id,
                **edu_item.model_dump(),
            )
            db.add(edu)

        # 4. Add Skills
        for skill_item in reg_data.skills:
            target_skill_id = skill_item.skill_id
            if not target_skill_id and skill_item.custom_skill_name:
                custom_name = skill_item.custom_skill_name.strip()
                existing_skill = db.query(Skill).filter(Skill.name.ilike(custom_name)).first()
                if existing_skill:
                    target_skill_id = existing_skill.id
                else:
                    new_skill = Skill(
                        name=custom_name,
                        category=skill_item.category or "Other",
                        is_verified_seed=False,
                    )
                    db.add(new_skill)
                    db.flush()
                    target_skill_id = new_skill.id

            if target_skill_id:
                # Prevent duplicate user_skill pairs
                user_skill = UserSkill(
                    user_id=user.id,
                    skill_id=target_skill_id,
                    self_level=skill_item.self_level,
                    status="claimed",
                )
                db.add(user_skill)

        # 5. Add Interests
        unique_interest_ids = set(reg_data.interest_ids)
        for i_id in unique_interest_ids:
            interest_exists = db.query(Interest).filter(Interest.id == i_id).first()
            if interest_exists:
                user_interest = UserInterest(
                    user_id=user.id,
                    interest_id=i_id,
                )
                db.add(user_interest)

        # 6. Add Projects (if any)
        if reg_data.projects:
            for proj_item in reg_data.projects:
                proj = Project(
                    user_id=user.id,
                    **proj_item.model_dump(),
                )
                db.add(proj)

        # 7. Add Experiences (if any)
        if reg_data.experiences:
            for exp_item in reg_data.experiences:
                exp = Experience(
                    user_id=user.id,
                    **exp_item.model_dump(),
                )
                db.add(exp)

        db.commit()
        db.refresh(user)
        return user
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed due to a database error: {e!s}",
        )


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Verify email and password; returns the user if credentials are valid."""
    email_clean = email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
