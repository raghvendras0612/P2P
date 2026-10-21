from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# 9 seeded career paths from catalog
VALID_CAREER_PATH_SLUGS = {
    "full-stack-developer",
    "data-engineer",
    "ai-ml-engineer",
    "devops-cloud-engineer",
    "cybersecurity-analyst",
    "data-analyst-scientist",
    "product-manager-apm",
    "ui-ux-designer",
    "mobile-app-developer",
}


# ============================================================================
# Inner Simulation Models
# ============================================================================


class IndiaMarketNotes(BaseModel):
    model_config = ConfigDict(extra="forbid")

    typical_roles: List[str] = Field(
        ..., min_length=1, description="Common entry-level job titles in India"
    )
    company_types: List[str] = Field(
        ...,
        min_length=1,
        description="Types of hiring companies (Product, Tier-1 Service, Startup, MNC)",
    )
    salary_range_lpa: str = Field(
        ..., min_length=1, description="Realistic fresher CTC range in INR LPA (e.g. '6 - 12 LPA')"
    )
    is_approximate: bool = Field(True, description="Strictly flagged as approximate projection")
    demand_outlook: str = Field(
        ..., min_length=5, description="Industry hiring trajectory across Indian tech hubs"
    )

    @field_validator("salary_range_lpa")
    @classmethod
    def validate_salary(cls, v: str) -> str:
        v_clean = v.strip()
        if not v_clean:
            raise ValueError("salary_range_lpa cannot be empty")
        return v_clean


class YearlyMilestone(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str = Field(..., min_length=3, description="Academic year or post-grad phase label")
    goals: List[str] = Field(..., min_length=1, description="Core objectives for this phase")
    skills_to_learn: List[str] = Field(
        ..., min_length=1, description="Technical skills & toolchains to acquire"
    )
    projects: List[str] = Field(
        ..., min_length=1, description="Key projects to implement during this year"
    )
    target_activities: List[str] = Field(
        ..., min_length=1, description="Internships, hackathons, open source or certifications"
    )
    checkpoints: List[str] = Field(
        ..., min_length=1, description="Concrete measurable criteria to verify readiness"
    )


class SkillGap(BaseModel):
    model_config = ConfigDict(extra="forbid")

    skill: str = Field(..., min_length=1, description="Skill name")
    current_level: int = Field(
        ...,
        ge=0,
        le=5,
        description="Estimated current level (0=None, 1=Beginner, 2=Elementary, 3=Intermediate, 4=Proficient, 5=Advanced)",
    )
    required_level: int = Field(..., ge=0, le=5, description="Target industry requirement (0-5)")
    priority: Literal["high", "medium", "low"] = Field(
        ..., description="Priority for campus/entry hiring"
    )
    why_it_matters: str = Field(
        ..., min_length=5, description="Why this gap impacts Indian placement interviews"
    )


class ProjectRecommendation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=2, description="Project title")
    description: str = Field(..., min_length=10, description="Architecture and functional overview")
    tech_stack: str = Field(
        ..., min_length=2, description="Technologies, libraries, and frameworks"
    )
    difficulty: Literal["Beginner", "Intermediate", "Advanced"] = Field(...)
    estimated_weeks: int = Field(
        ..., ge=1, le=24, description="Feasible completion duration in weeks"
    )
    what_it_proves: str = Field(
        ..., min_length=5, description="What competency this project proves to an interviewer"
    )
    stretch_goal: Optional[str] = Field(None, description="Optional advanced feature extension")


class WeekPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    week_number: int = Field(..., ge=1, le=4)
    theme: str = Field(..., min_length=3)
    daily_tasks: List[str] = Field(
        ..., min_length=1, description="Checklist of specific daily/weekly actions"
    )
    resources: List[str] = Field(
        ..., min_length=1, description="Real, well-known platforms/docs (no fake URLs)"
    )
    end_of_week_outcome: str = Field(
        ..., min_length=5, description="Tangible artifact or skill proof built"
    )


class FirstMonthPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    weeks: List[WeekPlan] = Field(..., description="Strictly 4 weeks")

    @field_validator("weeks")
    @classmethod
    def validate_four_weeks(cls, v: List[WeekPlan]) -> List[WeekPlan]:
        if len(v) != 4:
            raise ValueError(f"first_month_plan must contain exactly 4 weeks, got {len(v)}")
        week_nums = [w.week_number for w in v]
        if sorted(week_nums) != [1, 2, 3, 4]:
            raise ValueError(f"Weeks must be numbered 1 through 4 sequentially, got {week_nums}")
        return v


class ResourceRecommendation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(
        ...,
        min_length=2,
        description="Resource name (e.g. 'MDN Web Docs', 'FastAPI Official Tutorial')",
    )
    type: Literal[
        "Official Documentation", "Interactive Platform", "Course", "Community / Repo", "Book"
    ] = Field(...)
    cost: Literal["Free", "Low-cost"] = Field(...)
    description: str = Field(..., min_length=5)


class SimulatedPath(BaseModel):
    model_config = ConfigDict(extra="forbid")

    path_slug: str = Field(..., description="Slug from catalog (e.g. 'full-stack-developer')")
    title: str = Field(..., min_length=3, description="Display title for career path")
    summary: str = Field(
        ..., min_length=20, description="One-paragraph synthesis of this career path"
    )
    fit_score: int = Field(..., ge=0, le=100, description="Overall suitability score 0-100")
    fit_reasoning: str = Field(
        ...,
        min_length=15,
        description="Justification referencing student's actual claimed skills and interests",
    )
    india_market_notes: IndiaMarketNotes
    yearly_milestones: List[YearlyMilestone] = Field(..., min_length=1)
    skill_gaps: List[SkillGap] = Field(
        ..., min_length=6, max_length=10, description="Strictly 6 to 10 radar-chart skill gaps"
    )
    projects_to_build: List[ProjectRecommendation] = Field(
        ..., min_length=3, max_length=5, description="3 to 5 resume projects"
    )
    first_month_plan: FirstMonthPlan
    resources: List[ResourceRecommendation] = Field(..., min_length=2)
    risks_and_tradeoffs: List[str] = Field(
        ..., min_length=1, description="Realistic friction points, challenges or market risks"
    )

    @field_validator("path_slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        slug = v.strip().lower()
        if slug not in VALID_CAREER_PATH_SLUGS:
            raise ValueError(
                f"path_slug '{slug}' is not recognized in career catalog. Valid slugs: {sorted(VALID_CAREER_PATH_SLUGS)}"
            )
        return slug


class SimulationOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    paths: List[SimulatedPath] = Field(
        ..., min_length=3, max_length=3, description="Strictly 3 realistic simulated career paths"
    )
    assumptions_made: List[str] = Field(
        ..., min_length=1, description="Assumptions regarding student's study capacity and timeline"
    )
    disclaimers: List[str] = Field(
        ...,
        min_length=1,
        description="Honest disclaimers that output reflects projections, not guarantees",
    )
    overall_recommendation: str = Field(
        ..., min_length=20, description="Synthesized recommendation comparing the paths"
    )

    @field_validator("paths")
    @classmethod
    def validate_paths_collection(cls, paths: List[SimulatedPath]) -> List[SimulatedPath]:
        if len(paths) != 3:
            raise ValueError(f"Simulation must return exactly 3 paths, got {len(paths)}")

        # 1. Ensure all slugs are unique
        slugs = [p.path_slug for p in paths]
        if len(set(slugs)) != 3:
            raise ValueError(
                f"Simulation paths must have distinct slugs, found duplicates: {slugs}"
            )

        # 2. Ensure fit scores differ meaningfully (not all identical)
        scores = [p.fit_score for p in paths]
        if len(set(scores)) == 1:
            raise ValueError(
                f"All three paths have identical fit scores ({scores[0]}). Scores must reflect differentiated fit."
            )

        return paths

    @model_validator(mode="after")
    def validate_disclaimers_present(self) -> "SimulationOutput":
        if not self.disclaimers:
            raise ValueError(
                "disclaimers list cannot be empty. Must include projection disclaimer."
            )
        # Check disclaimer wording
        disclaimer_text = " ".join(self.disclaimers).lower()
        if "guarantee" not in disclaimer_text and "projection" not in disclaimer_text:
            self.disclaimers.append(
                "All milestones and salary estimates are projections, not guarantees."
            )
        return self


# ============================================================================
# Request & Response Schemas
# ============================================================================


class CreateSimulationRequest(BaseModel):
    mode: Literal["auto", "custom"] = Field(
        "auto", description="Auto selects 3 best fit paths; custom uses specified paths"
    )
    custom_path_slugs: Optional[List[str]] = Field(
        None, description="Up to 3 specific slugs from career_paths catalog"
    )

    @field_validator("custom_path_slugs")
    @classmethod
    def validate_custom_slugs(cls, slugs: Optional[List[str]]) -> Optional[List[str]]:
        if slugs is None:
            return None
        if len(slugs) == 0 or len(slugs) > 3:
            raise ValueError("custom_path_slugs must contain between 1 and 3 path slugs")
        clean = [s.strip().lower() for s in slugs]
        if len(set(clean)) != len(clean):
            raise ValueError("custom_path_slugs cannot contain duplicate slugs")
        for s in clean:
            if s not in VALID_CAREER_PATH_SLUGS:
                raise ValueError(
                    f"Invalid career path slug '{s}'. Valid: {sorted(VALID_CAREER_PATH_SLUGS)}"
                )
        return clean


class UserSkillWhatIfInput(BaseModel):
    skill_name: str
    self_level: int = Field(..., ge=1, le=3)
    category: Optional[str] = "Other"


class ResimulateRequest(BaseModel):
    what_if_added_skills: Optional[List[UserSkillWhatIfInput]] = Field(
        None, description="Hypothetical added skills"
    )
    what_if_added_interest_ids: Optional[List[int]] = Field(
        None, description="Hypothetical added interests"
    )


class RegeneratePathRequest(BaseModel):
    path_slug: str

    @field_validator("path_slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        slug = v.strip().lower()
        if slug not in VALID_CAREER_PATH_SLUGS:
            raise ValueError(
                f"Invalid path_slug '{slug}'. Valid slugs: {sorted(VALID_CAREER_PATH_SLUGS)}"
            )
        return slug


class SimulationJobResponse(BaseModel):
    job_id: str
    status: Literal["queued", "running", "succeeded", "failed"]
    simulation_id: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class SimulationComparisonSummary(BaseModel):
    fit_score_changes: Dict[str, int] = Field(
        default_factory=dict,
        description="Delta in fit score per path slug (e.g. {'full-stack-developer': +10})",
    )
    closed_gaps: List[str] = Field(
        default_factory=list, description="Skills where current level improved"
    )
    new_gaps: List[str] = Field(
        default_factory=list, description="New gaps introduced by new requirements"
    )
    summary_text: str = Field(
        ..., description="High-level narrative of what changed between simulations"
    )


class SimulationSummaryResponse(BaseModel):
    id: int
    user_id: int
    mode: str
    prompt_version: str
    model_name: str
    created_at: datetime
    top_path_slug: Optional[str] = None
    top_path_title: Optional[str] = None
    fit_scores: Dict[str, int] = Field(default_factory=dict)


class SimulationDetailResponse(BaseModel):
    id: int
    user_id: int
    mode: str
    prompt_version: str
    model_name: str
    created_at: datetime
    input_snapshot: Dict[str, Any]
    output: SimulationOutput
    comparison: Optional[SimulationComparisonSummary] = None
