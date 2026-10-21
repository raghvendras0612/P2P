from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.catalog import Skill
    from app.models.user import User


class QuestionBank(Base):
    __tablename__ = "question_bank"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    skill_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("skills.id", ondelete="CASCADE"), index=True, nullable=False
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "single_choice", "multi_select", "predict_output"
    code_snippet: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    options_json: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, nullable=False
    )  # [{"id": "A", "text": "..."}]
    correct_answers_json: Mapped[list[str]] = mapped_column(
        JSON, nullable=False
    )  # ["A"] or ["A", "C"]
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[int] = mapped_column(Integer, index=True, nullable=False)  # 1 to 5
    subtopic_tag: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    times_served: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    times_correct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    skill: Mapped["Skill"] = relationship("Skill")


class TestAttempt(Base):
    __tablename__ = "test_attempts"
    __test__ = False

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    skill_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("skills.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(30), default="in_progress", index=True, nullable=False
    )  # "in_progress", "completed", "abandoned", "expired"
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    time_limit_seconds: Mapped[int] = mapped_column(
        Integer, default=2700, nullable=False
    )  # 45 mins
    total_questions: Mapped[int] = mapped_column(Integer, default=25, nullable=False)
    total_points: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    earned_points: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    score_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    verified_level: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )  # 1: Beginner, 2: Intermediate, 3: Advanced, 4: Expert
    pass_mark: Mapped[float] = mapped_column(Float, default=60.0, nullable=False)
    tab_switch_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    feedback_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)

    user: Mapped["User"] = relationship("User")
    skill: Mapped["Skill"] = relationship("Skill")
    answers: Mapped[list["AttemptAnswer"]] = relationship(
        "AttemptAnswer",
        back_populates="attempt",
        cascade="all, delete-orphan",
        order_by="AttemptAnswer.question_order",
    )


class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    attempt_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("test_attempts.id", ondelete="CASCADE"), index=True, nullable=False
    )
    question_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("question_bank.id", ondelete="CASCADE"), index=True, nullable=False
    )
    question_order: Mapped[int] = mapped_column(Integer, nullable=False)
    selected_answers_json: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    is_correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    points_awarded: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    answered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    attempt: Mapped["TestAttempt"] = relationship("TestAttempt", back_populates="answers")
    question: Mapped["QuestionBank"] = relationship("QuestionBank")


class SkillProficiencyHistory(Base):
    __tablename__ = "skill_proficiency_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    skill_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("skills.id", ondelete="CASCADE"), index=True, nullable=False
    )
    attempt_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("test_attempts.id", ondelete="SET NULL"), nullable=True
    )
    old_status: Mapped[str] = mapped_column(String(30), nullable=False)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    old_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    new_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    score_achieved: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User")
    skill: Mapped["Skill"] = relationship("Skill")
