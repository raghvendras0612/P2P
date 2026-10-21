import re
from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class QuestionOption(BaseModel):
    id: str = Field(..., pattern=r"^[A-D]$", description="Option identifier A, B, C, or D")
    text: str = Field(..., min_length=1, max_length=1000)


class GeneratedQuestion(BaseModel):
    question_text: str = Field(..., min_length=10, max_length=2000)
    question_type: Literal["single_choice", "multi_select", "predict_output"]
    code_snippet: Optional[str] = Field(None, max_length=3000)
    options: List[QuestionOption] = Field(..., min_length=4, max_length=4)
    correct_answers: List[str] = Field(..., min_length=1, max_length=3)
    explanation: str = Field(..., min_length=10, max_length=2000)
    difficulty: int = Field(..., ge=1, le=5)
    subtopic_tag: str = Field(..., min_length=2, max_length=100)

    @field_validator("options")
    @classmethod
    def validate_unique_option_ids(cls, v: List[QuestionOption]) -> List[QuestionOption]:
        ids = [opt.id.upper() for opt in v]
        if len(ids) != 4 or sorted(ids) != ["A", "B", "C", "D"]:
            raise ValueError("Questions must have exactly 4 options with IDs A, B, C, D.")
        return v

    @field_validator("correct_answers")
    @classmethod
    def validate_answers_against_options(cls, v: List[str]) -> List[str]:
        cleaned = [ans.strip().upper() for ans in v]
        for ans in cleaned:
            if ans not in {"A", "B", "C", "D"}:
                raise ValueError(f"Correct answer '{ans}' must be one of A, B, C, D.")
        if len(cleaned) != len(set(cleaned)):
            raise ValueError("Correct answers cannot contain duplicates.")
        return cleaned

    @model_validator(mode="after")
    def validate_question_integrity(self) -> "GeneratedQuestion":
        # 1. Single-choice & predict_output must have strictly 1 correct option
        if self.question_type in ["single_choice", "predict_output"]:
            if len(self.correct_answers) != 1:
                raise ValueError(
                    f"Question type '{self.question_type}' must have strictly 1 correct option, got {len(self.correct_answers)}."
                )
        elif self.question_type == "multi_select":
            if len(self.correct_answers) < 2:
                raise ValueError(
                    f"Multi-select question must have at least 2 correct options, got {len(self.correct_answers)}."
                )

        # 2. Check for answer leakage in question_text
        text_lower = self.question_text.lower()
        leakage_patterns = [
            r"\bcorrect answer is [a-d]\b",
            r"\bthe answer is [a-d]\b",
            r"\boption [a-d] is correct\b",
            r"\bchoose option [a-d]\b",
            r"\banswer:\s*[a-d]\b",
        ]
        for pat in leakage_patterns:
            if re.search(pat, text_lower):
                raise ValueError(f"Answer leakage detected in question text: matches '{pat}'.")

        return self


class GeneratedQuestionBatch(BaseModel):
    skill_name: str
    questions: List[GeneratedQuestion] = Field(..., min_length=20, max_length=30)

    @field_validator("questions")
    @classmethod
    def validate_batch_quality(cls, v: List[GeneratedQuestion]) -> List[GeneratedQuestion]:
        # 1. Reject duplicate or near-duplicate questions
        seen_texts = set()
        for q in v:
            norm = re.sub(r"[^\w\s]", "", q.question_text.lower()).strip()
            if norm in seen_texts:
                raise ValueError(
                    f"Duplicate or near-duplicate question detected: '{q.question_text[:50]}'"
                )
            seen_texts.add(norm)

        # 2. Difficulty distribution: about 30% easy (1-2), 40% medium (3), 30% hard (4-5)
        total = len(v)
        easy_count = sum(1 for q in v if q.difficulty in [1, 2])
        med_count = sum(1 for q in v if q.difficulty == 3)
        hard_count = sum(1 for q in v if q.difficulty in [4, 5])

        if not (0.20 <= easy_count / total <= 0.45):
            raise ValueError(
                f"Invalid difficulty distribution: {easy_count}/{total} easy questions ({easy_count / total:.0%}). Expected ~30%."
            )
        if not (0.25 <= med_count / total <= 0.55):
            raise ValueError(
                f"Invalid difficulty distribution: {med_count}/{total} medium questions ({med_count / total:.0%}). Expected ~40%."
            )
        if not (0.20 <= hard_count / total <= 0.45):
            raise ValueError(
                f"Invalid difficulty distribution: {hard_count}/{total} hard questions ({hard_count / total:.0%}). Expected ~30%."
            )

        return v


# --- Client-Facing Sanitized Schemas (NO ANSWERS, NO EXPLANATIONS) ---
class ClientQuestionOption(BaseModel):
    id: str
    text: str


class ClientTestQuestion(BaseModel):
    attempt_answer_id: int
    question_id: int
    question_order: int
    question_text: str
    question_type: str
    code_snippet: Optional[str] = None
    options: List[ClientQuestionOption]
    difficulty: int
    subtopic_tag: str
    selected_answers: Optional[List[str]] = None


class ActiveTestSessionRead(BaseModel):
    attempt_id: int
    skill_id: int
    skill_name: str
    category: str
    status: str
    started_at: datetime
    expires_at: datetime
    time_limit_seconds: int
    time_remaining_seconds: int
    total_questions: int
    questions: List[ClientTestQuestion]
    tab_switch_count: int


class AnswerSubmitRequest(BaseModel):
    question_id: int = Field(..., ge=1)
    selected_answers: List[str] = Field(..., min_length=0, max_length=4)
    time_spent_seconds: Optional[int] = Field(0, ge=0)


class QuestionReviewDetail(BaseModel):
    question_order: int
    question_text: str
    question_type: str
    code_snippet: Optional[str] = None
    options: List[ClientQuestionOption]
    selected_answers: List[str]
    correct_answers: List[str]
    is_correct: bool
    points_awarded: float
    explanation: str
    difficulty: int
    subtopic_tag: str


class TestResultResponse(BaseModel):
    __test__ = False
    attempt_id: int
    skill_id: int
    skill_name: str
    status: str
    score_percentage: float
    total_points: float
    earned_points: float
    passed: bool
    verified_level: Optional[int]
    verified_level_name: Optional[str]
    pass_mark: float
    accuracy_by_difficulty: Dict[str, float]
    accuracy_by_subtopic: Dict[str, float]
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    tab_switch_count: int
    completed_at: Optional[datetime]
    question_reviews: List[QuestionReviewDetail]


class ClaimedSkillTestEligibility(BaseModel):
    skill_id: int
    name: str
    category: str
    self_level: int
    status: str  # "claimed", "verified", "failed"
    verified_level: Optional[int] = None
    verified_level_name: Optional[str] = None
    last_tested_at: Optional[datetime] = None
    can_take_test: bool
    cooldown_remaining_seconds: int = 0
    cooldown_ends_at: Optional[datetime] = None
    is_path_priority: bool = False
    active_attempt_id: Optional[int] = None
