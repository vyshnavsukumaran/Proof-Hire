from datetime import date

from sqlalchemy import Column, Date, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.associations import project_skills, user_skills
from app.models.base import TimestampMixin
from app.models.enums import ProjectType


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    project_type: Mapped[ProjectType] = mapped_column(Enum(ProjectType), default=ProjectType.professional)
    role: Mapped[str | None] = mapped_column(String(200), nullable=True)
    problem: Mapped[str | None] = mapped_column(Text, nullable=True)
    contribution: Mapped[str | None] = mapped_column(Text, nullable=True)
    process: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[str | None] = mapped_column(Text, nullable=True)
    tools: Mapped[str | None] = mapped_column(String(500), nullable=True)
    media_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    project_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    visibility: Mapped[str] = mapped_column(String(20), default="live")
    likes: Mapped[int] = mapped_column(default=0)
    views: Mapped[int] = mapped_column(default=0)

    owner: Mapped["User"] = relationship(back_populates="projects")
    skills: Mapped[list["Skill"]] = relationship(secondary=project_skills, back_populates="projects")

    __table_args__ = (UniqueConstraint("owner_id", "title", name="uq_project_owner_title"),)
