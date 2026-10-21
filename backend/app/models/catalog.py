from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
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
    from app.models.simulation import Simulation
    from app.models.user import User


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    aliases: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_verified_seed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user_skills: Mapped[list["UserSkill"]] = relationship(
        "UserSkill", back_populates="skill", cascade="all, delete-orphan"
    )


class UserSkill(Base):
    __tablename__ = "user_skills"
    __table_args__ = (UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    skill_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("skills.id", ondelete="CASCADE"), index=True, nullable=False
    )
    self_level: Mapped[int] = mapped_column(
        Integer, nullable=False
    )  # 1: Beginner, 2: Intermediate, 3: Advanced
    status: Mapped[str] = mapped_column(
        String(20), default="claimed", nullable=False
    )  # "claimed", "verified", "failed"
    verified_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    last_tested_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="user_skills")


class Interest(Base):
    __tablename__ = "interests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    group: Mapped[str] = mapped_column(String(100), index=True, nullable=False)

    user_interests: Mapped[list["UserInterest"]] = relationship(
        "UserInterest", back_populates="interest", cascade="all, delete-orphan"
    )


class UserInterest(Base):
    __tablename__ = "user_interests"
    __table_args__ = (UniqueConstraint("user_id", "interest_id", name="uq_user_interest"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    interest_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("interests.id", ondelete="CASCADE"), index=True, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="interests")
    interest: Mapped["Interest"] = relationship("Interest", back_populates="user_interests")


class CareerPath(Base):
    __tablename__ = "career_paths"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    selections: Mapped[list["UserSelectedPath"]] = relationship(
        "UserSelectedPath", back_populates="career_path", cascade="all, delete-orphan"
    )


class UserSelectedPath(Base):
    __tablename__ = "user_selected_path"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    career_path_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("career_paths.id", ondelete="CASCADE"), index=True, nullable=False
    )
    simulation_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("simulations.id", ondelete="SET NULL"), index=True, nullable=True
    )
    selected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="selected_paths")
    career_path: Mapped["CareerPath"] = relationship("CareerPath", back_populates="selections")
    simulation: Mapped[Optional["Simulation"]] = relationship("Simulation")
