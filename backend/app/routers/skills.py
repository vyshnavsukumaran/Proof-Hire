from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Skill
from app.schemas.schemas import SkillOut

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("", response_model=list[SkillOut])
def list_skills(q: str | None = None, limit: int = 50, db: Session = Depends(get_db)):
    stmt = select(Skill).order_by(Skill.name)
    if q:
        stmt = stmt.where(Skill.name.ilike(f"%{q}%"))
    skills = db.execute(stmt.limit(limit)).scalars().all()
    return [SkillOut.model_validate(s) for s in skills]
