from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.profile import (
    EducationCreate,
    ExperienceCreate,
    ProjectCreate,
    StudentProfileCreate,
    UserSkillClaimInput,
)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password with minimum 8 characters")
    profile: StudentProfileCreate
    education: List[EducationCreate] = Field(
        ..., min_length=1, description="At least one education entry required"
    )
    skills: List[UserSkillClaimInput] = Field(
        ..., min_length=1, description="At least one claimed skill required"
    )
    interest_ids: List[int] = Field(..., min_length=1, description="At least one interest required")
    projects: Optional[List[ProjectCreate]] = []
    experiences: Optional[List[ExperienceCreate]] = []


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None
