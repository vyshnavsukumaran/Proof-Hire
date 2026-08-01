from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import CandidateProfile, Job, JobStatus, User, UserRole, user_skills
from app.schemas.schemas import JobOut, UserWithProfile

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("/talent", response_model=list[UserWithProfile])
def search_talent(
    q: str | None = None,
    skills: str | None = None,
    location: str | None = None,
    availability: str | None = None,
    min_years: int | None = None,
    project_type: str | None = None,
    limit: int = Query(24, le=100),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    stmt = (
        select(User)
        .join(CandidateProfile, CandidateProfile.user_id == User.id)
        .where(User.role == UserRole.candidate, CandidateProfile.visibility == "live")
    )
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (User.name.ilike(like))
            | (CandidateProfile.headline.ilike(like))
            | (CandidateProfile.summary.ilike(like))
        )
    if location:
        stmt = stmt.where(User.location.ilike(f"%{location}%"))
    if availability:
        stmt = stmt.where(User.availability == availability)
    if min_years is not None:
        stmt = stmt.where(CandidateProfile.years_experience >= min_years)

    candidates = db.execute(stmt.order_by(CandidateProfile.total_views.desc()).limit(limit).offset(offset)).scalars().all()

    # Filter by skill match
    if skills:
        skill_names = {s.strip().lower() for s in skills.split(",") if s.strip()}
        result = []
        for c in candidates:
            cand_skills = {s.name.lower() for s in c.skills}
            if cand_skills & skill_names:
                result.append(c)
        candidates = result

    out = []
    for c in candidates:
        data = UserWithProfile.model_validate(c)
        profile = db.execute(
            select(CandidateProfile).where(CandidateProfile.user_id == c.id)
        ).scalar_one_or_none()
        data.profile = profile
        data.skills = list(c.skills)
        data.project_count = len(c.projects)
        out.append(data)
    return out


@router.get("/jobs", response_model=list[JobOut])
def search_jobs(
    q: str | None = None,
    skills: str | None = None,
    location: str | None = None,
    remote: bool | None = None,
    employment_type: str | None = None,
    experience_level: str | None = None,
    limit: int = Query(24, le=100),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    from app.routers.jobs import _serialize

    stmt = select(Job).where(Job.status == JobStatus.open)
    if q:
        like = f"%{q}%"
        stmt = stmt.where((Job.title.ilike(like)) | (Job.summary.ilike(like)))
    if location:
        stmt = stmt.where(Job.location.ilike(f"%{location}%"))
    if remote is not None:
        stmt = stmt.where(Job.remote == remote)
    if employment_type:
        stmt = stmt.where(Job.employment_type == employment_type)
    if experience_level:
        stmt = stmt.where(Job.experience_level == experience_level)
    if skills:
        for s in skills.split(","):
            if s.strip():
                stmt = stmt.where(Job.required_skills.ilike(f"%{s.strip()}%"))

    jobs = db.execute(stmt.order_by(Job.created_at.desc()).limit(limit).offset(offset)).scalars().all()
    return [_serialize(j) for j in jobs]
