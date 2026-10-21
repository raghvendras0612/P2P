from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.user import User


class ResumeDocument(Base):
    __tablename__ = "resume_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    career_path_slug: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    template_id: Mapped[str] = mapped_column(
        String(50), default="minimal_ats", nullable=False
    )  # "minimal_ats", "classic_single", "modern_compact"
    target_role: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    custom_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    show_unverified_skills: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    custom_sections_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User")
