from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models import (
    Application,
    ApplicationStatus,
    CandidateProfile,
    Job,
    JobStatus,
    Project,
    User,
    UserRole,
)
from app.schemas.schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatusUpdate,
    ProjectOut,
)

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _serialize(db: Session, app: Application) -> ApplicationOut:
    out = ApplicationOut.model_validate(app)
    out.job_title = app.job.title if app.job else ""
    out.candidate_name = app.candidate.name if app.candidate else ""
    if app.candidate:
        profile = db.execute(
            select(CandidateProfile).where(CandidateProfile.user_id == app.candidate.id)
        ).scalar_one_or_none()
        out.candidate_headline = profile.headline or "" if profile else ""
    if app.evidence_project_ids:
        ids = [int(i) for i in app.evidence_project_ids.split(",") if i.strip().isdigit()]
        projects = db.execute(select(Project).where(Project.id.in_(ids))).scalars().all()
        out.evidence_projects = [ProjectOut.model_validate(p) for p in projects]
    return out


@router.post("", response_model=ApplicationOut, status_code=201)
def apply(
    payload: ApplicationCreate,
    user: User = Depends(require_role(UserRole.candidate)),
    db: Session = Depends(get_db),
):
    job = db.get(Job, payload.job_id)
    if not job or job.status != JobStatus.open:
        raise HTTPException(status_code=404, detail="Job not found or closed")

    existing = db.execute(
        select(Application).where(
            Application.job_id == job.id, Application.candidate_id == user.id
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")

    evidence = ",".join(str(i) for i in payload.evidence_project_ids)
    app = Application(
        job_id=job.id,
        candidate_id=user.id,
        cover_letter=payload.cover_letter,
        evidence_project_ids=evidence or None,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return _serialize(db, app)


@router.get("/mine", response_model=list[ApplicationOut])
def my_applications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    apps = (
        db.execute(
            select(Application)
            .where(Application.candidate_id == user.id)
            .order_by(Application.created_at.desc())
        )
        .scalars()
        .all()
    )
    return [_serialize(db, a) for a in apps]


@router.get("/for-job/{job_id}", response_model=list[ApplicationOut])
def job_applications(
    job_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)
    if not job or job.employer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your job")
    apps = (
        db.execute(
            select(Application)
            .where(Application.job_id == job_id)
            .order_by(Application.created_at.desc())
        )
        .scalars()
        .all()
    )
    return [_serialize(db, a) for a in apps]


@router.get("/received", response_model=list[ApplicationOut])
def received_applications(
    user: User = Depends(require_role(UserRole.employer)),
    db: Session = Depends(get_db),
):
    apps = (
        db.execute(
            select(Application)
            .join(Job, Job.id == Application.job_id)
            .where(Job.employer_id == user.id)
            .order_by(Application.created_at.desc())
        )
        .scalars()
        .all()
    )
    return [_serialize(db, a) for a in apps]


@router.patch("/{application_id}/status", response_model=ApplicationOut)
def update_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = db.get(Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    is_employer = app.job and app.job.employer_id == user.id
    is_candidate = app.candidate_id == user.id
    if not (is_employer or is_candidate):
        raise HTTPException(status_code=403, detail="Not allowed")
    if is_candidate and payload.status != ApplicationStatus.withdrawn:
        raise HTTPException(status_code=403, detail="Only employers can change this status")
    app.status = payload.status
    db.commit()
    db.refresh(app)
    return _serialize(db, app)
