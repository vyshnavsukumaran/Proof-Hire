from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models import Application, CandidateProfile, Job, Project, User, UserRole
from app.schemas.schemas import (
    PortfolioAnalyticsOut,
    RecommendationOut,
)

router = APIRouter(prefix="/api", tags=["recommendations", "analytics"])


@router.get("/recommendations/jobs", response_model=list[RecommendationOut])
def recommend_jobs_for_candidate(
    user: User = Depends(require_role(UserRole.candidate)),
    db: Session = Depends(get_db),
):
    from app.services.matching import recommend_jobs

    results = recommend_jobs(db, user, limit=6)
    out = []
    for job, score in results:
        reason = f"Your skills overlap with the required skills for {job.title}."
        out.append(
            RecommendationOut(
                id=job.id,
                title=job.title,
                score=score,
                reason=reason,
                detail={"type": "job", "employer": job.employer.name if job.employer else ""},
            )
        )
    return out


@router.get("/recommendations/candidates", response_model=list[RecommendationOut])
def recommend_candidates_for_employer(
    job_id: int | None = None,
    user: User = Depends(require_role(UserRole.employer)),
    db: Session = Depends(get_db),
):
    from app.services.matching import recommend_candidates

    job = db.get(Job, job_id) if job_id else None
    if job_id and not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job:
        results = recommend_candidates(db, job, limit=6)
    else:
        candidates = (
            db.execute(
                select(User)
                .join(CandidateProfile, CandidateProfile.user_id == User.id)
                .where(User.role == UserRole.candidate, CandidateProfile.visibility == "live")
            )
            .scalars()
            .all()
        )
        results = [(c, 50 + len(c.projects)) for c in candidates]

    out = []
    for cand, score in results:
        out.append(
            RecommendationOut(
                id=cand.id,
                title=cand.name,
                score=score,
                reason=f"{len(cand.projects)} proof projects and {len(cand.skills)} verified skills.",
                detail={"type": "candidate", "headline": cand.profile.headline if cand.profile else ""},
            )
        )
    return out


@router.get("/users/me/analytics", response_model=PortfolioAnalyticsOut)
def my_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.execute(
        select(CandidateProfile).where(CandidateProfile.user_id == user.id)
    ).scalar_one_or_none()
    projects = (
        db.execute(select(Project).where(Project.owner_id == user.id)).scalars().all()
    )
    apps = (
        db.execute(select(Application).where(Application.candidate_id == user.id)).scalars().all()
    )

    top_projects = sorted(
        [{"id": p.id, "title": p.title, "views": p.views, "likes": p.likes} for p in projects],
        key=lambda x: x["views"] + x["likes"],
        reverse=True,
    )[:5]

    return PortfolioAnalyticsOut(
        total_views=profile.total_views if profile else 0,
        total_project_views=sum(p.views for p in projects),
        total_likes=sum(p.likes for p in projects),
        application_count=len(apps),
        interview_count=sum(1 for a in apps if a.status.value in ("interview", "offer")),
        offer_count=sum(1 for a in apps if a.status.value == "offer"),
        top_projects=top_projects,
    )
