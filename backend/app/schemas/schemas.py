from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import (
    ApplicationStatus,
    EmploymentType,
    ExperienceLevel,
    JobStatus,
    PortfolioVisibility,
    ProjectType,
    ShortlistStatus,
    UserRole,
)


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserOut(ORMModel):
    id: int
    email: EmailStr
    name: str
    role: UserRole
    avatar_url: str | None = None
    bio: str | None = None
    location: str | None = None
    availability: str | None = None
    created_at: datetime


class SkillOut(ORMModel):
    id: int
    name: str
    category: str | None = None


class CandidateProfileOut(ORMModel):
    id: int
    headline: str | None = None
    summary: str | None = None
    years_experience: int | None = 0
    visibility: str = "draft"
    total_views: int = 0


class ProjectOut(ORMModel):
    id: int
    title: str
    project_type: ProjectType
    role: str | None = None
    problem: str | None = None
    contribution: str | None = None
    process: str | None = None
    outcome: str | None = None
    tools: str | None = None
    media_url: str | None = None
    project_url: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    visibility: str = "live"
    likes: int = 0
    views: int = 0
    created_at: datetime
    skills: list[SkillOut] = []


class UserWithProfile(UserOut):
    profile: CandidateProfileOut | None = None
    skills: list[SkillOut] = []
    project_count: int = 0
    projects: list[ProjectOut] = []


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    project_type: ProjectType = ProjectType.professional
    role: str | None = None
    problem: str | None = None
    contribution: str | None = None
    process: str | None = None
    outcome: str | None = None
    tools: str | None = None
    media_url: str | None = None
    project_url: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    visibility: str = "live"
    skills: list[str] = []


class ProjectUpdate(BaseModel):
    title: str | None = None
    project_type: ProjectType | None = None
    role: str | None = None
    problem: str | None = None
    contribution: str | None = None
    process: str | None = None
    outcome: str | None = None
    tools: str | None = None
    media_url: str | None = None
    project_url: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    visibility: str | None = None
    skills: list[str] | None = None


class JobOut(ORMModel):
    id: int
    employer_id: int
    employer_name: str = ""
    title: str
    summary: str | None = None
    description: str | None = None
    required_skills: str | None = None
    required_skill_list: list[str] = []
    experience_level: ExperienceLevel
    employment_type: EmploymentType
    location: str | None = None
    remote: bool = False
    salary_min: int | None = None
    salary_max: int | None = None
    status: JobStatus
    created_at: datetime


class JobCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    summary: str | None = None
    description: str | None = None
    required_skills: str | None = None
    experience_level: ExperienceLevel = ExperienceLevel.mid
    employment_type: EmploymentType = EmploymentType.fulltime
    location: str | None = None
    remote: bool = False
    salary_min: int | None = None
    salary_max: int | None = None


class JobUpdate(BaseModel):
    title: str | None = None
    summary: str | None = None
    description: str | None = None
    required_skills: str | None = None
    experience_level: ExperienceLevel | None = None
    employment_type: EmploymentType | None = None
    location: str | None = None
    remote: bool | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    status: JobStatus | None = None


class ApplicationOut(ORMModel):
    id: int
    job_id: int
    job_title: str = ""
    candidate_id: int
    candidate_name: str = ""
    candidate_headline: str = ""
    cover_letter: str | None = None
    evidence_project_ids: str | None = None
    evidence_projects: list[ProjectOut] = []
    status: ApplicationStatus
    created_at: datetime


class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: str | None = None
    evidence_project_ids: list[int] = []


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ConversationOut(ORMModel):
    id: int
    job_id: int | None = None
    job_title: str = ""
    candidate_id: int
    candidate_name: str = ""
    employer_id: int
    employer_name: str = ""
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread: int = 0


class MessageOut(ORMModel):
    id: int
    conversation_id: int
    sender_id: int
    body: str
    read: bool
    created_at: datetime


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class ShortlistOut(ORMModel):
    id: int
    employer_id: int
    candidate_id: int
    candidate: UserWithProfile | None = None
    status: ShortlistStatus
    notes: str | None = None
    score: int | None = None
    created_at: datetime


class ShortlistUpdate(BaseModel):
    status: ShortlistStatus | None = None
    notes: str | None = None
    score: int | None = None


class ShortlistCreate(BaseModel):
    candidate_id: int
    status: ShortlistStatus = ShortlistStatus.saved
    notes: str | None = None


class RecommendationOut(BaseModel):
    id: int
    title: str
    score: int
    reason: str
    detail: dict[str, Any] = {}


class SearchTalentParams(BaseModel):
    skills: list[str] = []
    location: str | None = None
    availability: str | None = None
    project_type: ProjectType | None = None
    min_years: int | None = None
    q: str | None = None
    limit: int = 24
    offset: int = 0


class SearchJobsParams(BaseModel):
    q: str | None = None
    skills: list[str] = []
    location: str | None = None
    remote: bool | None = None
    employment_type: EmploymentType | None = None
    experience_level: ExperienceLevel | None = None
    limit: int = 24
    offset: int = 0


class PortfolioAnalyticsOut(BaseModel):
    total_views: int
    total_project_views: int
    total_likes: int
    application_count: int
    interview_count: int
    offer_count: int
    top_projects: list[dict[str, Any]] = []
