from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Project, User, UserRole, user_skills
from app.services.skills import normalize, split_skills


def candidate_skill_names(db: Session, candidate: User) -> set[str]:
    rows = db.execute(
        select(user_skills.c.skill_id).where(user_skills.c.user_id == candidate.id)
    ).all()
    skill_ids = [r[0] for r in rows]
    if not skill_ids:
        return set()
    from app.models import Skill

    names = db.execute(select(Skill.name).where(Skill.id.in_(skill_ids))).all()
    return {normalize(n[0]) for n in names}


def project_skill_names(db: Session, project: Project) -> set[str]:
    from app.models import Skill

    return {normalize(s.name) for s in project.skills}


def job_required_skills(job) -> set[str]:
    return {normalize(s) for s in split_skills(job.required_skills)}


def match_score_for_job(db: Session, candidate: User, job) -> int:
    """Return a 0-100 match score between a candidate and a job."""
    score = 0
    candidate_skills = candidate_skill_names(db, candidate)
    required = job_required_skills(job)

    # Skill overlap: up to 60 points, proportional to coverage
    if required:
        coverage = len(candidate_skills & required) / len(required)
        score += int(60 * coverage)

    # Experience level fit: 20 points
    level_order = {"entry": 0, "junior": 1, "mid": 2, "senior": 3, "lead": 4}
    cand_years = candidate.profile.years_experience if candidate.profile else 0
    job_level = level_order.get(job.experience_level.value if hasattr(job.experience_level, "value") else str(job.experience_level), 2)
    if cand_years >= job_level * 2:
        score += 20
    elif cand_years >= job_level:
        score += 12
    else:
        score += 6

    # Availability / remote: 20 points
    if candidate.availability == job.employment_type.value:
        score += 15
    elif job.remote:
        score += 10
    if job.remote and candidate.location != job.location:
        score += 5

    return min(score, 100)


def match_score_for_candidate(db: Session, candidate: User, job) -> int:
    """Job -> candidate quality score; symmetric-ish but employer-weighted."""
    return match_score_for_job(db, candidate, job)


def recommend_jobs(db: Session, candidate: User, limit: int = 6) -> list[tuple[object, int]]:
    from app.models import Job, JobStatus

    jobs = db.execute(select(Job).where(Job.status == JobStatus.open)).scalars().all()
    scored = [(job, match_score_for_job(db, candidate, job)) for job in jobs]
    scored = [s for s in scored if s[1] > 0]
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:limit]


def recommend_candidates(db: Session, job, limit: int = 6) -> list[tuple[User, int]]:
    from app.models import CandidateProfile

    candidates = (
        db.execute(
            select(User)
            .join(CandidateProfile, CandidateProfile.user_id == User.id)
            .where(User.role == UserRole.candidate, CandidateProfile.visibility == "live")
        )
        .scalars()
        .all()
    )
    scored = [(c, match_score_for_job(db, c, job)) for c in candidates]
    scored = [s for s in scored if s[1] > 0]
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:limit]
