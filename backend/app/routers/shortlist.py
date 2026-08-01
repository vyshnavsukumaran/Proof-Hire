from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models import CandidateProfile, ShortlistEntry, User, UserRole
from app.schemas.schemas import ShortlistCreate, ShortlistOut, ShortlistUpdate, UserWithProfile

router = APIRouter(prefix="/api/shortlist", tags=["shortlist"])


def _serialize(db: Session, entry: ShortlistEntry) -> ShortlistOut:
    out = ShortlistOut.model_validate(entry)
    candidate = db.get(User, entry.candidate_id)
    if candidate:
        data = UserWithProfile.model_validate(candidate)
        profile = db.execute(
            select(CandidateProfile).where(CandidateProfile.user_id == candidate.id)
        ).scalar_one_or_none()
        data.profile = profile
        data.skills = list(candidate.skills)
        data.project_count = len(candidate.projects)
        out.candidate = data
    return out


@router.post("", response_model=ShortlistOut, status_code=201)
def add_to_shortlist(
    payload: ShortlistCreate,
    user: User = Depends(require_role(UserRole.employer)),
    db: Session = Depends(get_db),
):
    target = db.get(User, payload.candidate_id)
    if not target or target.role != UserRole.candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    existing = db.execute(
        select(ShortlistEntry).where(
            ShortlistEntry.employer_id == user.id,
            ShortlistEntry.candidate_id == payload.candidate_id,
        )
    ).scalar_one_or_none()
    if existing:
        existing.status = payload.status
        if payload.notes:
            existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        return _serialize(db, existing)

    entry = ShortlistEntry(
        employer_id=user.id,
        candidate_id=payload.candidate_id,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _serialize(db, entry)


@router.get("", response_model=list[ShortlistOut])
def list_shortlist(
    user: User = Depends(require_role(UserRole.employer)),
    db: Session = Depends(get_db),
):
    entries = (
        db.execute(
            select(ShortlistEntry)
            .where(ShortlistEntry.employer_id == user.id)
            .order_by(ShortlistEntry.updated_at.desc())
        )
        .scalars()
        .all()
    )
    return [_serialize(db, e) for e in entries]


@router.patch("/{entry_id}", response_model=ShortlistOut)
def update_shortlist(
    entry_id: int,
    payload: ShortlistUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.get(ShortlistEntry, entry_id)
    if not entry or entry.employer_id != user.id:
        raise HTTPException(status_code=404, detail="Entry not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return _serialize(db, entry)


@router.delete("/{entry_id}", status_code=204)
def remove_shortlist(
    entry_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.get(ShortlistEntry, entry_id)
    if not entry or entry.employer_id != user.id:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
