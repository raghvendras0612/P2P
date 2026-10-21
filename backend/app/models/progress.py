from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.user import User


class ProgressItem(Base):
    __tablename__ = "progress_items"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "career_path_slug",
            "item_type",
            "item_ref",
            name="uq_user_path_item",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    career_path_slug: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    item_type: Mapped[str] = mapped_column(
        String(50), index=True, nullable=False
    )  # "milestone_checkpoint", "first_month_task", "project"
    item_ref: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default="not_started", nullable=False
    )  # "not_started", "in_progress", "completed"
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    repo_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User")


class UserStreak(Base):
    __tablename__ = "user_streaks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    current_streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_activity_date: Mapped[Optional[str]] = mapped_column(
        String(10), nullable=True
    )  # "YYYY-MM-DD"
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User")
