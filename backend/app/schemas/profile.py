import re
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.catalog import CareerPathRead, InterestRead
from app.schemas.simulation import SimulatedPath

INDIAN_PHONE_REGEX = re.compile(r"^[6-9]\d{9}$")


class EducationCreate(BaseModel):
    level: str = Field(..., description="e.g. 10th, 12th, Diploma, Undergraduate")
    institution_name: str = Field(..., min_length=2, max_length=255)
    board_or_university: str = Field(..., min_length=2, max_length=150)
    passing_year: int = Field(..., ge=1990, le=2035)
    percentage: float = Field(..., ge=0.0, le=100.0)


class EducationRead(EducationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=5)
    tech_stack: str = Field(..., min_length=2, max_length=255)
    link: Optional[str] = Field(None, max_length=255)
    start_date: Optional[str] = Field(None, max_length=50)
    end_date: Optional[str] = Field(None, max_length=50)


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, min_length=5)
    tech_stack: Optional[str] = Field(None, min_length=2, max_length=255)
    link: Optional[str] = Field(None, max_length=255)
    start_date: Optional[str] = Field(None, max_length=50)
    end_date: Optional[str] = Field(None, max_length=50)


class ProjectRead(ProjectCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime


class ExperienceCreate(BaseModel):
    type: str = Field(..., description="internship, hackathon, certification, achievement")
    title: str = Field(..., min_length=2, max_length=150)
    organization: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    date_or_duration: Optional[str] = Field(None, max_length=100)
    link: Optional[str] = Field(None, max_length=255)


class ExperienceUpdate(BaseModel):
    type: Optional[str] = Field(
        None, description="internship, hackathon, certification, achievement"
    )
    title: Optional[str] = Field(None, min_length=2, max_length=150)
    organization: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    date_or_duration: Optional[str] = Field(None, max_length=100)
    link: Optional[str] = Field(None, max_length=255)


class ExperienceRead(ExperienceCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime


class UserSkillClaimInput(BaseModel):
    skill_id: Optional[int] = None
    custom_skill_name: Optional[str] = None
    category: Optional[str] = "Other"
    self_level: int = Field(
        ..., ge=1, le=3, description="1: Beginner, 2: Intermediate, 3: Advanced"
    )


class UserSkillRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill_id: int
    skill_name: str
    category: str
    self_level: int
    status: str
    verified_level: Optional[int] = None
    last_tested_at: Optional[datetime] = None


class UserInterestInput(BaseModel):
    interest_ids: List[int]


class StudentProfileBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., description="10-digit Indian mobile number")
    college: str = Field(..., min_length=2, max_length=255)
    branch: str = Field(..., min_length=2, max_length=100)
    year_of_study: int = Field(..., ge=1, le=4)
    expected_graduation_year: int = Field(..., ge=2024, le=2032)
    cgpa: float = Field(..., ge=0.0, le=10.0)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    linkedin_url: Optional[str] = Field(None, max_length=255)
    github_url: Optional[str] = Field(None, max_length=255)
    portfolio_url: Optional[str] = Field(None, max_length=255)
    career_goal_text: Optional[str] = None
    preferred_work_style: Optional[str] = Field(None, max_length=50)

    @field_validator("phone")
    @classmethod
    def validate_indian_phone(cls, v: str) -> str:
        clean = re.sub(r"[\s\-\+]", "", v)
        if clean.startswith("91") and len(clean) == 12:
            clean = clean[2:]
        if not INDIAN_PHONE_REGEX.match(clean):
            raise ValueError(
                "Phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
            )
        return clean

    @field_validator("full_name", "college", "branch", "city", "state")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class StudentProfileCreate(StudentProfileBase):
    pass


class StudentProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone: Optional[str] = None
    college: Optional[str] = Field(None, min_length=2, max_length=255)
    branch: Optional[str] = Field(None, min_length=2, max_length=100)
    year_of_study: Optional[int] = Field(None, ge=1, le=4)
    expected_graduation_year: Optional[int] = Field(None, ge=2024, le=2032)
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    linkedin_url: Optional[str] = Field(None, max_length=255)
    github_url: Optional[str] = Field(None, max_length=255)
    portfolio_url: Optional[str] = Field(None, max_length=255)
    career_goal_text: Optional[str] = None
    preferred_work_style: Optional[str] = Field(None, max_length=50)

    @field_validator("phone")
    @classmethod
    def validate_indian_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = re.sub(r"[\s\-\+]", "", v)
        if clean.startswith("91") and len(clean) == 12:
            clean = clean[2:]
        if not INDIAN_PHONE_REGEX.match(clean):
            raise ValueError("Phone number must be a valid 10-digit Indian mobile number.")
        return clean


class StudentProfileRead(StudentProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class FullProfileRead(BaseModel):
    user_id: int
    email: str
    profile: Optional[StudentProfileRead] = None
    education: List[EducationRead] = []
    skills: List[UserSkillRead] = []
    interests: List[InterestRead] = []
    projects: List[ProjectRead] = []
    experiences: List[ExperienceRead] = []
    selected_path: Optional[CareerPathRead] = None


class SelectPathRequest(BaseModel):
    path_slug: str = Field(
        ..., min_length=2, max_length=100, description="Slug of the career path to select"
    )
    simulation_id: Optional[int] = Field(
        None, description="Optional ID of simulation this selection was chosen from"
    )


class SelectedPathDetailRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    career_path: CareerPathRead
    simulation_id: Optional[int] = None
    selected_at: datetime
    is_active: bool
    simulated_path: Optional[SimulatedPath] = None


class SelectedPathResponse(BaseModel):
    selected_path: Optional[SelectedPathDetailRead] = None
