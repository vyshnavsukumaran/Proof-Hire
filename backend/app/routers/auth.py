from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.supabase import SupabaseAuthError, supabase
from app.models import User, UserRole
from app.schemas.auth import LoginIn, ProfileUpdate, RefreshIn, RegisterIn, TokenOut
from app.schemas.schemas import UserWithProfile

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_with_profile(db: Session, user: User) -> UserWithProfile:
    from app.models import CandidateProfile

    profile = db.execute(select(CandidateProfile).where(CandidateProfile.user_id == user.id)).scalar_one_or_none()
    from app.services.matching import candidate_skill_names

    data = UserWithProfile.model_validate(user)
    data.profile = profile
    data.skills = list(user.skills)
    data.project_count = len(user.projects)
    return data


def _session_out(db: Session, session: dict) -> TokenOut:
    email = session["user"]["email"]
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=400, detail="Account not found")
    uid = session["user"]["id"]
    if user.supabase_uid != uid:
        user.supabase_uid = uid
        db.commit()
    return TokenOut(
        access_token=session["access_token"],
        refresh_token=session["refresh_token"],
        user_id=user.id,
        role=user.role,
        name=user.name,
    )


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    existing = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        created = supabase.sign_up(payload.email, payload.password, payload.name)
    except SupabaseAuthError as e:
        if e.code == 422:
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=e.code, detail=e.message)

    if "access_token" not in created:
        try:
            created = supabase.sign_in(payload.email, payload.password)
        except SupabaseAuthError as e:
            raise HTTPException(status_code=e.code, detail=e.message)

    user = User(
        email=payload.email,
        supabase_uid=created["user"]["id"],
        name=payload.name,
        role=payload.role,
    )
    db.add(user)
    db.flush()

    if payload.role == UserRole.candidate:
        from app.models import CandidateProfile

        db.add(CandidateProfile(user_id=user.id, visibility="draft"))
    db.commit()
    db.refresh(user)

    return TokenOut(
        access_token=created["access_token"],
        refresh_token=created["refresh_token"],
        user_id=user.id,
        role=user.role,
        name=user.name,
    )


@router.post("/login", response_model=TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        session = supabase.sign_in(form.username, form.password)
    except SupabaseAuthError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
    return _session_out(db, session)


@router.post("/login/json", response_model=TokenOut)
def login_json(payload: LoginIn, db: Session = Depends(get_db)):
    try:
        session = supabase.sign_in(payload.email, payload.password)
    except SupabaseAuthError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
    return _session_out(db, session)


@router.post("/refresh", response_model=TokenOut)
def refresh_token(payload: RefreshIn, db: Session = Depends(get_db)):
    try:
        session = supabase.refresh(payload.refresh_token)
    except SupabaseAuthError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
    return _session_out(db, session)


@router.get("/me", response_model=UserWithProfile)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _user_with_profile(db, user)


@router.patch("/me", response_model=UserWithProfile)
def update_me(payload: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models import CandidateProfile, Skill

    updates = payload.model_dump(exclude_unset=True)
    skills = updates.pop("skills", None)

    if "name" in updates:
        user.name = updates.pop("name")
    if "avatar_url" in updates:
        user.avatar_url = updates.pop("avatar_url")
    if "bio" in updates:
        user.bio = updates.pop("bio")
    if "location" in updates:
        user.location = updates.pop("location")
    if "availability" in updates:
        user.availability = updates.pop("availability")

    if user.role == UserRole.candidate:
        profile = db.execute(
            select(CandidateProfile).where(CandidateProfile.user_id == user.id)
        ).scalar_one_or_none()
        if profile is None:
            profile = CandidateProfile(user_id=user.id)
            db.add(profile)
        for field, value in updates.items():
            if hasattr(profile, field) and value is not None:
                setattr(profile, field, value)

        if skills is not None:
            user.skills = []
            for name in skills:
                skill = db.execute(select(Skill).where(Skill.name == name)).scalar_one_or_none()
                if skill is None:
                    skill = Skill(name=name)
                    db.add(skill)
                user.skills.append(skill)

    db.commit()
    db.refresh(user)
    return _user_with_profile(db, user)
