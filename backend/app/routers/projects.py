from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models import Project, Skill, User, UserRole
from app.schemas.schemas import ProjectCreate, ProjectOut, ProjectUpdate

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _apply_skills(db: Session, project: Project, skill_names: list[str]):
    project.skills = []
    for name in skill_names:
        skill = db.execute(select(Skill).where(Skill.name == name)).scalar_one_or_none()
        if skill is None:
            skill = Skill(name=name)
            db.add(skill)
        project.skills.append(skill)


def _serialize(project: Project) -> ProjectOut:
    return ProjectOut.model_validate(project)


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    payload: ProjectCreate,
    user: User = Depends(require_role(UserRole.candidate)),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude={"skills"})
    project = Project(owner_id=user.id, **data)
    db.add(project)
    try:
        db.flush()
        _apply_skills(db, project, payload.skills or [])
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="You already have a project with this title. Edit the existing one or pick a different title.",
        )
    db.refresh(project)
    return _serialize(project)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _serialize(project)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not your project")

    data = payload.model_dump(exclude_unset=True)
    skills = data.pop("skills", None)
    for field, value in data.items():
        setattr(project, field, value)
    if skills is not None:
        _apply_skills(db, project, skills)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Another project already uses this title. Pick a different title.",
        )
    db.refresh(project)
    return _serialize(project)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not your project")
    db.delete(project)
    db.commit()


@router.post("/{project_id}/view", response_model=ProjectOut)
def record_view(project_id: int, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.views += 1
    from app.models import CandidateProfile

    profile = db.execute(
        select(CandidateProfile).where(CandidateProfile.user_id == project.owner_id)
    ).scalar_one_or_none()
    if profile:
        profile.total_views += 1
    db.commit()
    db.refresh(project)
    return _serialize(project)


@router.post("/{project_id}/like", response_model=ProjectOut)
def like_project(project_id: int, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.likes += 1
    db.commit()
    db.refresh(project)
    return _serialize(project)
