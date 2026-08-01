from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.core.supabase import supabase
from app.routers import (
    applications,
    auth,
    jobs,
    messaging,
    projects,
    recommendations,
    search,
    shortlist,
    skills,
    uploads,
    users,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    if settings.supabase_url:
        try:
            supabase.ensure_bucket()
        except Exception:
            pass
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(skills.router)
app.include_router(jobs.router)
app.include_router(search.router)
app.include_router(applications.router)
app.include_router(messaging.router)
app.include_router(shortlist.router)
app.include_router(recommendations.router)
app.include_router(uploads.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name}
