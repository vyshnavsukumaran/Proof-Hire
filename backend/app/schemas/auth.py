from pydantic import BaseModel, EmailStr, Field

from app.models.enums import Availability, UserRole


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=120)
    role: UserRole


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    role: UserRole
    name: str


class ProfileUpdate(BaseModel):
    headline: str | None = None
    summary: str | None = None
    years_experience: int | None = None
    visibility: str | None = None
    availability: str | None = None
    bio: str | None = None
    location: str | None = None
    avatar_url: str | None = None
    name: str | None = None
    skills: list[str] | None = None
