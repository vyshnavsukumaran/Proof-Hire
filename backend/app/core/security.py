from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.supabase import SupabaseAuthError, supabase
from app.models import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        sb_user = supabase.get_user(token)
    except SupabaseAuthError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
    if not sb_user:
        raise credentials_exception

    uid = sb_user.get("id")
    user = db.execute(select(User).where(User.supabase_uid == uid)).scalar_one_or_none()
    if user is None:
        user = db.execute(select(User).where(User.email == sb_user.get("email", ""))).scalar_one_or_none()
        if user is None:
            raise credentials_exception
        user.supabase_uid = uid
        db.commit()
    return user


def require_role(*roles: UserRole):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed for this role")
        return user

    return dependency
