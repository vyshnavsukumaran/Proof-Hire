from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models import Job, JobStatus, User, UserRole
from app.schemas.schemas import JobCreate, JobOut, JobUpdate

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _serialize(job: Job) -> JobOut:
    out = JobOut.model_validate(job)
    employer = job.employer
    if employer:
        out.employer_name = employer.name
    from app.services.skills import split_skills

    out.required_skill_list = split_skills(job.required_skills)
    return out


@router.post("", response_model=JobOut, status_code=201)
def create_job(
    payload: JobCreate,
    user: User = Depends(require_role(UserRole.employer)),
    db: Session = Depends(get_db),
):
    job = Job(employer_id=user.id, **payload.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return _serialize(job)


@router.get("", response_model=list[JobOut])
def list_jobs(
    q: str | None = None,
    skills: str | None = None,
    location: str | None = None,
    remote: bool | None = None,
    employment_type: str | None = None,
    experience_level: str | None = None,
    status: str = "open",
    limit: int = 24,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    stmt = select(Job).where(Job.status == JobStatus.open)
    if status == "all":
        stmt = select(Job)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(Job.title.ilike(like) | Job.summary.ilike(like))
    if location:
        stmt = stmt.where(Job.location.ilike(f"%{location}%"))
    if remote is not None:
        stmt = stmt.where(Job.remote == remote)
    if employment_type:
        stmt = stmt.where(Job.employment_type == employment_type)
    if experience_level:
        stmt = stmt.where(Job.experience_level == experience_level)
    if skills:
        stmt = stmt.where(Job.required_skills.ilike(f"%{skills}%"))

    jobs = db.execute(stmt.order_by(Job.created_at.desc()).limit(limit).offset(offset)).scalars().all()
    return [_serialize(j) for j in jobs]


@router.get("/mine", response_model=list[JobOut])
def my_jobs(
    user: User = Depends(require_role(UserRole.employer)),
    db: Session = Depends(get_db),
):
    jobs = db.execute(
        select(Job).where(Job.employer_id == user.id).order_by(Job.created_at.desc())
    ).scalars().all()
    return [_serialize(j) for j in jobs]


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _serialize(job)


@router.patch("/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    payload: JobUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.employer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your job")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return _serialize(job)


@router.delete("/{job_id}", status_code=204)
def delete_job(
    job_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.employer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your job")
    db.delete(job)
    db.commit()
