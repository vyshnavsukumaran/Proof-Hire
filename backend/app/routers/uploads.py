import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.supabase import SupabaseAuthError, supabase
from app.models import Project, User

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}


def _upload_file(file: UploadFile) -> str:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    data = file.file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 5MB)")

    object_name = f"{uuid.uuid4().hex}{suffix}"
    try:
        return supabase.upload(object_name, data, file.content_type or "application/octet-stream")
    except SupabaseAuthError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@router.post("/avatar", response_model=dict)
def upload_avatar(
    file: UploadFile,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    url = _upload_file(file)
    user.avatar_url = url
    db.add(user)
    db.commit()
    return {"url": url}


@router.post("/project-media", response_model=dict)
def upload_project_media(
    file: UploadFile,
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project or project.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    url = _upload_file(file)
    project.media_url = url
    db.commit()
    return {"url": url, "media_url": project.media_url}
