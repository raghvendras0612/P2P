from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class ProgressToggleRequest(BaseModel):
    career_path_slug: str = Field(..., min_length=2, max_length=100)
    item_type: Literal["milestone_checkpoint", "first_month_task"]
    item_ref: str = Field(..., min_length=1, max_length=255)
    status: Literal["not_started", "completed"]


class ProjectProgressUpdateRequest(BaseModel):
    career_path_slug: str = Field(..., min_length=2, max_length=100)
    project_title: str = Field(..., min_length=2, max_length=255)
    status: Literal["not_started", "in_progress", "completed"]
    repo_url: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None


class NextBestAction(BaseModel):
    title: str
    action_type: Literal["skill_test", "milestone_checkpoint", "project", "resume", "simulation"]
    link: str
    description: str


class MilestoneProgressSummary(BaseModel):
    total_checkpoints: int
    completed_checkpoints: int
    percent_complete: int


class ProjectProgressItem(BaseModel):
    project_title: str
    status: str
    repo_url: Optional[str] = None
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None


class SkillGrowthDataPoint(BaseModel):
    skill_name: str
    verified_level: int
    verified_level_name: str
    score_achieved: Optional[float] = None
    date: str  # YYYY-MM-DD


class ProgressDashboardResponse(BaseModel):
    career_path_slug: Optional[str] = None
    career_path_name: Optional[str] = None
    milestone_progress: MilestoneProgressSummary
    overall_roadmap_percent: int
    current_streak_days: int
    longest_streak_days: int
    last_activity_date: Optional[str] = None
    completed_items_map: Dict[str, bool]
    projects_progress: List[ProjectProgressItem]
    next_best_action: Optional[NextBestAction] = None
