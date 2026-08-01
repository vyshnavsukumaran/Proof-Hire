import os
import sys
import uuid

os.environ["DATABASE_URL"] = "sqlite:///./test_proofhire.db"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.supabase import Supabase, SupabaseAuthError
from app.main import app


class FakeSupabase(Supabase):
    """In-memory stand-in for the Supabase client used by tests."""

    def __init__(self):
        self.url = "https://fake.supabase.co"
        self.anon = "anon"
        self.service = "service"
        self.bucket = "uploads"
        self.users = {}  # email -> {"id", "password", "name"}
        self.tokens = {}  # access_token -> user id

    def _session(self, user_id):
        access = f"access-{user_id}"
        refresh = f"refresh-{user_id}"
        self.tokens[access] = user_id
        user = {"id": str(user_id), "email": self._email_for(user_id)}
        return {"access_token": access, "refresh_token": refresh, "user": user}

    def _email_for(self, user_id):
        for email, u in self.users.items():
            if u["id"] == user_id:
                return email
        return ""

    def sign_up(self, email: str, password: str, name: str) -> dict:
        if email in self.users:
            raise SupabaseAuthError("User already registered", 422)
        uid = str(uuid.uuid4())
        self.users[email] = {"id": uid, "password": password, "name": name}
        return self._session(uid)

    def sign_in(self, email: str, password: str) -> dict:
        u = self.users.get(email)
        if not u or u["password"] != password:
            raise SupabaseAuthError("Invalid email or password", 401)
        return self._session(u["id"])

    def refresh(self, refresh_token: str) -> dict:
        uid = refresh_token.removeprefix("refresh-")
        if uid not in [u["id"] for u in self.users.values()]:
            raise SupabaseAuthError("Session expired", 401)
        return self._session(uid)

    def get_user(self, access_token: str) -> dict:
        uid = self.tokens.get(access_token)
        if not uid:
            raise SupabaseAuthError("Invalid token", 401)
        return {"id": uid, "email": self._email_for(uid)}

    def ensure_bucket(self) -> None:
        pass

    def upload(self, object_name: str, data: bytes, content_type: str) -> str:
        return f"https://fake.supabase.co/storage/v1/object/public/uploads/{object_name}"


@pytest.fixture()
def client():
    fake = FakeSupabase()
    from app.core import supabase as supabase_module

    real = supabase_module.supabase
    for method in ("sign_up", "sign_in", "refresh", "get_user", "ensure_bucket", "upload"):
        setattr(real, method, getattr(fake, method))
    for attr in ("url", "anon", "service", "bucket"):
        setattr(real, attr, getattr(fake, attr))

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
