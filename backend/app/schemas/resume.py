from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class ResumeEducationItem(BaseModel):
    level: str
    institution_name: str
    board_or_university: str
    passing_year: int
    percentage: float


class ResumeProjectItem(BaseModel):
    title: str
    description: str
    tech_stack: str
    link: Optional[str] = None


class ResumeExperienceItem(BaseModel):
    type: str
    title: str
    organization: Optional[str] = None
    description: Optional[str] = None
    date_or_duration: Optional[str] = None
    link: Optional[str] = None


class ResumeSkillItem(BaseModel):
    name: str
    category: str
    status: Literal["claimed", "verified", "failed"]
    self_level: int
    verified_level: Optional[int] = None
    verified_level_name: Optional[str] = None


class ResumeStrengthCheck(BaseModel):
    score: int = Field(..., ge=0, le=100)
    criteria_met: List[str]
    missing_items: List[str]
    improvement_tips: List[str]


class ResumeCompiledData(BaseModel):
    template_id: str
    target_role: Optional[str] = None
    career_path_slug: Optional[str] = None
    career_path_name: Optional[str] = None
    full_name: str
    email: str
    phone: str
    city: str
    state: str
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    summary: str
    is_tailored: bool = False
    show_unverified_skills: bool = True
    verified_skills: List[ResumeSkillItem]
    unverified_skills: List[ResumeSkillItem]
    education: List[ResumeEducationItem]
    projects: List[ResumeProjectItem]
    experiences: List[ResumeExperienceItem]
    strength: ResumeStrengthCheck
    updated_at: datetime
    # Frontend compatibility fields
    selected_template: Optional[str] = None
    strength_score: Optional[int] = None
    strength_checklist: Optional[List[Dict[str, Any]]] = None


class UpdateResumeSettingsRequest(BaseModel):
    template_id: Optional[Literal["minimal_ats", "classic_single", "modern_compact"]] = None
    template_name: Optional[Literal["minimal_ats", "classic_single", "modern_compact"]] = None
    target_role: Optional[str] = Field(None, max_length=150)
    custom_summary: Optional[str] = Field(None, max_length=2000)
    show_unverified_skills: Optional[bool] = None
    include_unverified_skills: Optional[bool] = None


class TailorResumeRequest(BaseModel):
    career_path_slug: Optional[str] = Field(
        None, description="Optional target path slug. Defaults to active selected path."
    )


class TailorResumeResponse(BaseModel):
    target_role: str
    career_path_slug: str
    tailored_summary: str
    ordered_project_titles: List[str]
    relevant_skills_highlighted: List[str]
