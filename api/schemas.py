from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class SkillItem(BaseModel):
    name: str
    level: Literal["Beginner", "Intermediate", "Advanced"]
    verified: Optional[bool] = False
    verifiedScore: Optional[float] = None

class BackgroundProject(BaseModel):
    name: str
    description: Optional[str] = ""
    techStack: Optional[List[str]] = []
    githubOrLiveUrl: Optional[str] = ""

class BackgroundInternship(BaseModel):
    role: str
    company: str
    duration: Optional[str] = ""
    description: Optional[str] = ""

class StudentProfile(BaseModel):
    careerId: Optional[str] = None
    name: str
    college: Optional[str] = "Engineering College"
    branch: Literal["CSE", "IT", "ECE", "EE", "ME", "Civil", "Other"]
    yearOfStudy: int = Field(ge=1, le=4)
    cgpa: float = Field(ge=0.0, le=10.0)
    hoursPerWeek: int = Field(ge=1, le=80)
    skills: List[SkillItem]
    interests: List[str]
    tenthPercentage: Optional[float] = None
    twelfthPercentage: Optional[float] = None
    diploma: Optional[str] = None
    certifications: Optional[List[str]] = []
    projects: Optional[List[BackgroundProject]] = []
    internships: Optional[List[BackgroundInternship]] = []
    achievements: Optional[List[str]] = []

class Milestone(BaseModel):
    title: str
    status: Literal["achieved", "in_progress", "remaining"]
    requiredSkills: List[str]

class YearRoadmap(BaseModel):
    year: str
    academicYear: int
    theme: str
    milestones: List[Milestone]
    skillsToLearn: List[str]
    projectsToBuild: List[str]

class SkillGap(BaseModel):
    skill: str
    currentLevel: int = Field(ge=0, le=5)
    requiredLevel: int = Field(ge=0, le=5)
    priority: Literal["high", "medium", "low"]

class RecommendedProject(BaseModel):
    name: str
    description: str
    techStack: List[str]
    difficulty: Literal["Beginner", "Intermediate", "Advanced"]
    estimatedHours: int

class WeeklyPlan(BaseModel):
    week: int
    title: str
    goals: List[str]
    dailyHours: float
    deliverable: str

class LearningResource(BaseModel):
    title: str
    url: str
    type: Literal["course", "docs", "roadmap", "practice", "video"]
    isFree: bool

class CareerPath(BaseModel):
    pathId: Literal["full_stack", "ai_ml", "data_science"]
    title: str
    subtitle: str
    badge: Optional[str] = None
    matchScore: int = Field(ge=0, le=100)
    matchReason: str
    dayInLife: str
    yearByYear: List[YearRoadmap]
    skillGaps: List[SkillGap]
    projects: List[RecommendedProject]
    firstMonthPlan: List[WeeklyPlan]
    resources: List[LearningResource]

class SimulationResponse(BaseModel):
    full_stack: CareerPath
    ai_ml: CareerPath
    data_science: CareerPath
    fallback: Optional[bool] = False

class QuizQuestion(BaseModel):
    id: str
    skill: str
    level: str
    type: Literal["mcq", "short_answer"]
    question: str
    options: Optional[List[str]] = None
    correctOptionIndex: Optional[int] = None
    explanation: Optional[str] = None

class QuestionsResponse(BaseModel):
    questions: List[QuizQuestion]
    fallback: Optional[bool] = False

class AnswerSubmission(BaseModel):
    questionId: str
    skill: str
    selectedOptionIndex: Optional[int] = None
    shortAnswer: Optional[str] = None

class EvaluationRequest(BaseModel):
    profile: StudentProfile
    answers: List[AnswerSubmission]

class SkillScore(BaseModel):
    skill: str
    score: float = Field(ge=0, le=5)
    previousLevel: str
    adjustedLevel: str
    verified: bool
    feedback: str

class EvaluationResponse(BaseModel):
    skillScores: List[SkillScore]
    summary: str
    fallback: Optional[bool] = False

class RoadmapAdjustRequest(BaseModel):
    profile: StudentProfile
    verifiedSkills: List[SkillScore]

class MentorMessage(BaseModel):
    role: Literal["user", "model", "system"]
    content: str

class MentorRequest(BaseModel):
    profile: StudentProfile
    simulationSummary: Optional[dict] = None
    history: List[MentorMessage]

class MentorResponse(BaseModel):
    reply: str
    suggestedActions: Optional[List[str]] = []
    fallback: Optional[bool] = False

class ResumePolishRequest(BaseModel):
    profile: StudentProfile
    targetPath: Optional[str] = "full_stack"

class ResumePolishResponse(BaseModel):
    summary: str
    projectBulletPoints: List[dict]
    fallback: Optional[bool] = False
