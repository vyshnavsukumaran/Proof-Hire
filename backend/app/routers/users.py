from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import CandidateProfile, Project, User, UserRole
from app.schemas.schemas import UserWithProfile

router = APIRouter(prefix="/api/users", tags=["users"])


def serialize_profile(db: Session, user: User) -> UserWithProfile:
    profile = db.execute(
        select(CandidateProfile).where(CandidateProfile.user_id == user.id)
    ).scalar_one_or_none()
    data = UserWithProfile.model_validate(user)
    data.profile = profile
    data.skills = list(user.skills)
    data.project_count = len(user.projects)
    return data


@router.get("/{user_id}", response_model=UserWithProfile)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_profile(db, user)


@router.get("/{user_id}/portfolio", response_model=UserWithProfile)
def get_candidate_portfolio(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from app.models import Project

    profile = db.execute(
        select(CandidateProfile).where(CandidateProfile.user_id == user.id)
    ).scalar_one_or_none()

    data = serialize_profile(db, user)
    data.profile = profile

    if profile is not None and profile.visibility == "draft":
        data.projects = [p for p in user.projects if p.visibility == "live"]
    else:
        data.projects = [p for p in user.projects if p.visibility == "live"]

    return data
