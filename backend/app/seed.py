"""Seed the database with demo candidates, employers, projects, and jobs."""
import sys

from sqlalchemy import select

from app.core.database import Base, SessionLocal, engine
from app.core.supabase import SupabaseAuthError, supabase
from app.models import (
    Application,
    CandidateProfile,
    Conversation,
    Job,
    Message,
    Project,
    ShortlistEntry,
    Skill,
    User,
    UserRole,
)

CANDIDATES = [
    {
        "name": "Maya Chen",
        "email": "maya@demo.proofhire",
        "headline": "Product Designer & Design Systems Lead",
        "summary": "I design evidence-first product experiences. 7 years shipping SaaS tools used by millions.",
        "years": 7,
        "location": "Berlin",
        "availability": "fulltime",
        "bio": "Designer who cares about measurable outcomes.",
        "skills": ["Figma", "Design Systems", "UX Research", "Prototyping", "Accessibility"],
        "projects": [
            {
                "title": "Design System Rebuild — Nova UI",
                "role": "Design Systems Lead",
                "type": "professional",
                "problem": "Fragmented component libraries caused 40% slower feature delivery across 5 teams.",
                "contribution": "Led audit, token architecture, and component library migration for 12 engineers.",
                "process": "Ran 30+ designer/engineer interviews, built token pipeline, shipped 80 components with docs.",
                "outcome": "Cut design-to-dev handoff time 40%; design debt reduced 60%; adoption across all 5 product squads.",
                "tools": "Figma, Storybook, Tokens Studio, React",
                "skills": ["Design Systems", "Figma", "UX Research", "Prototyping"],
            },
            {
                "title": "Onboarding Flow Revamp",
                "role": "Product Designer",
                "type": "case_study",
                "problem": "Onboarding completion was 31% for new signups.",
                "contribution": "Redesigned the 9-step onboarding into a 3-step evidence-driven flow.",
                "process": "Usability-tested 18 users, iterated on copy and component states.",
                "outcome": "Onboarding completion up to 68%; activation +22% within one quarter.",
                "tools": "Figma, Maze, Mixpanel",
                "skills": ["UX Research", "Prototyping"],
            },
        ],
    },
    {
        "name": "Diego Alvarez",
        "email": "diego@demo.proofhire",
        "headline": "Full-Stack Engineer — Python, FastAPI, React",
        "summary": "I build reliable APIs and the frontends that consume them.",
        "years": 5,
        "location": "Remote (US East)",
        "availability": "freelance",
        "bio": "Shipping-focused engineer.",
        "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "TypeScript"],
        "projects": [
            {
                "title": "Real-Time Analytics Pipeline",
                "role": "Backend Engineer",
                "type": "professional",
                "problem": "Batch dashboards lagged 24h; teams needed live product telemetry.",
                "contribution": "Designed event ingestion, stream processing, and query API.",
                "process": "Built with FastAPI + Kafka + ClickHouse, deployed on k8s.",
                "outcome": "Dashboards now real-time; infra cost down 35% vs old vendor.",
                "tools": "FastAPI, Kafka, ClickHouse, Kubernetes",
                "skills": ["Python", "FastAPI", "PostgreSQL"],
            },
            {
                "title": "Open Source: FastAPI Boilerplate",
                "role": "Maintainer",
                "type": "open_source",
                "problem": "Teams re-scaffold the same auth/DB/test setup repeatedly.",
                "contribution": "Authored and maintain a production-grade FastAPI starter.",
                "process": "Includes JWT, async SQLAlchemy, pytest fixtures, CI.",
                "outcome": "1.4k GitHub stars; used by 40+ repos.",
                "tools": "FastAPI, SQLAlchemy, GitHub Actions",
                "skills": ["Python", "FastAPI"],
            },
        ],
    },
    {
        "name": "Sofia Nguyen",
        "email": "sofia@demo.proofhire",
        "headline": "Growth Marketer & Performance Analyst",
        "summary": "I turn marketing spend into measurable pipeline.",
        "years": 4,
        "location": "Toronto",
        "availability": "parttime",
        "bio": "",
        "skills": ["SEO", "Paid Search", "Analytics", "SQL", "Content Strategy"],
        "projects": [
            {
                "title": "B2B Paid Search Turnaround",
                "role": "Growth Lead",
                "type": "professional",
                "problem": "ROAS had fallen to 1.2x; budget under review.",
                "contribution": "Rebuilt account structure, keyword taxonomy, and landing tests.",
                "process": "Ran 60 creative/landing experiments over 2 quarters.",
                "outcome": "ROAS to 3.4x; cost per qualified lead down 55%.",
                "tools": "Google Ads, GA4, Looker",
                "skills": ["Paid Search", "Analytics"],
            },
        ],
    },
    {
        "name": "Tomás Rivera",
        "email": "tomas@demo.proofhire",
        "headline": "Mobile Engineer — Flutter & Swift",
        "summary": "Neo-brutalist UIs, but the code is very clean.",
        "years": 6,
        "location": "Mexico City",
        "availability": "fulltime",
        "bio": "",
        "skills": ["Flutter", "Swift", "Dart", "Firebase", "CI/CD"],
        "projects": [
            {
                "title": "Offline-First Field Sales App",
                "role": "Lead Mobile Engineer",
                "type": "professional",
                "problem": "Field reps in low-coverage areas lost work and data.",
                "contribution": "Led Flutter architecture with offline sync engine.",
                "process": "Designed local DB + conflict resolution, shipped to 800 devices.",
                "outcome": "Zero data loss; rep productivity +30%.",
                "tools": "Flutter, Firebase, Isar",
                "skills": ["Flutter", "Dart"],
            },
        ],
    },
]

EMPLOYERS = [
    {
        "name": "Nimbus Labs",
        "email": "hiring@nimbuslabs.demo",
        "bio": "We build weather-grade data infrastructure. Hiring for evidence, not credentials.",
        "location": "Remote",
        "skills": ["Python", "PostgreSQL", "Kubernetes"],
        "jobs": [
            {
                "title": "Senior Backend Engineer — Data Platform",
                "summary": "Design and ship the APIs that power our real-time forecast products.",
                "description": "You will own services from spec to production. Show us what you built.",
                "required_skills": "Python, FastAPI, PostgreSQL, Docker",
                "level": "senior",
                "type": "fulltime",
                "location": "Remote",
                "remote": True,
                "salary_min": 140000,
                "salary_max": 180000,
            },
            {
                "title": "Product Designer — Developer Tools",
                "summary": "Design developer-facing tooling that engineers actually love.",
                "description": "Portfolio of shipped work strongly preferred. We review evidence first.",
                "required_skills": "Figma, UX Research, Design Systems",
                "level": "mid",
                "type": "fulltime",
                "location": "Berlin",
                "remote": False,
                "salary_min": 75000,
                "salary_max": 95000,
            },
        ],
    },
    {
        "name": "Fieldwork Studio",
        "email": "jobs@fieldworkstudio.demo",
        "bio": "Independent studio for climate + civic tech. We hire people, not résumés.",
        "location": "Toronto",
        "skills": ["Flutter", "React", "Growth"],
        "jobs": [
            {
                "title": "Flutter Mobile Engineer",
                "summary": "Build civic apps that work offline and on low-end devices.",
                "description": "We want to see your apps, your commits, and how you think.",
                "required_skills": "Flutter, Dart, Firebase",
                "level": "mid",
                "type": "contract",
                "location": "Remote",
                "remote": True,
                "salary_min": 90000,
                "salary_max": 120000,
            },
        ],
    },
]


def _link_supabase_users(db) -> None:
    """Create the demo users in Supabase Auth and link supabase_uid to local rows."""
    demo = [
        (c["email"], c["name"]) for c in CANDIDATES
    ] + [(e["email"], e["name"]) for e in EMPLOYERS]
    for email, name in demo:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if user is None:
            continue
        if user.supabase_uid:
            continue
        try:
            session = supabase.sign_up(email, "password123", name)
        except SupabaseAuthError as e:
            if e.code == 422:
                session = supabase.sign_in(email, "password123")
            else:
                print(f"  ! could not create auth user {email}: {e.message}")
                continue
        user.supabase_uid = session["user"]["id"]
        db.add(user)
        db.commit()
        print(f"  linked {email} -> {user.supabase_uid}")


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.execute(select(User)).first():
            print("Database already seeded; linking Supabase Auth users.")
            _link_supabase_users(db)
            return

        # Skills
        skill_map = {}
        all_skill_names = set()
        for c in CANDIDATES:
            all_skill_names.update(c["skills"])
            for p in c["projects"]:
                all_skill_names.update(p["skills"])
        for e in EMPLOYERS:
            all_skill_names.update(e["skills"])
        for name in sorted(all_skill_names):
            skill = Skill(name=name)
            db.add(skill)
            db.flush()
            skill_map[name] = skill

        # Candidates
        candidates = []
        for c in CANDIDATES:
            try:
                session = supabase.sign_up(c["email"], "password123", c["name"])
            except SupabaseAuthError as e:
                if e.code == 422:
                    session = supabase.sign_in(c["email"], "password123")
                else:
                    raise
            user = User(
                email=c["email"],
                supabase_uid=session["user"]["id"],
                name=c["name"],
                role=UserRole.candidate,
                location=c["location"],
                availability=c["availability"],
                bio=c.get("bio"),
            )
            db.add(user)
            db.flush()
            profile = CandidateProfile(
                user_id=user.id,
                headline=c["headline"],
                summary=c["summary"],
                years_experience=c["years"],
                visibility="live",
            )
            db.add(profile)
            user.skills = [skill_map[s] for s in c["skills"] if s in skill_map]
            db.flush()
            candidates.append(user)

            for p in c["projects"]:
                project = Project(
                    owner_id=user.id,
                    title=p["title"],
                    role=p["role"],
                    project_type=p["type"],
                    problem=p["problem"],
                    contribution=p["contribution"],
                    process=p["process"],
                    outcome=p["outcome"],
                    tools=p["tools"],
                    visibility="live",
                    views=0,
                    likes=0,
                )
                project.skills = [skill_map[s] for s in p["skills"] if s in skill_map]
                db.add(project)
            db.flush()

        # Employers + jobs
        jobs = []
        for e in EMPLOYERS:
            try:
                session = supabase.sign_up(e["email"], "password123", e["name"])
            except SupabaseAuthError as ex:
                if ex.code == 422:
                    session = supabase.sign_in(e["email"], "password123")
                else:
                    raise
            user = User(
                email=e["email"],
                supabase_uid=session["user"]["id"],
                name=e["name"],
                role=UserRole.employer,
                location=e.get("location"),
                bio=e.get("bio"),
            )
            db.add(user)
            db.flush()
            user.skills = [skill_map[s] for s in e["skills"] if s in skill_map]

            for j in e["jobs"]:
                job = Job(
                    employer_id=user.id,
                    title=j["title"],
                    summary=j["summary"],
                    description=j["description"],
                    required_skills=j["required_skills"],
                    experience_level=j["level"],
                    employment_type=j["type"],
                    location=j["location"],
                    remote=j["remote"],
                    salary_min=j["salary_min"],
                    salary_max=j["salary_max"],
                )
                db.add(job)
                db.flush()
                jobs.append(job)

        # A few applications + a conversation to demo messaging
        candidate = candidates[0]
        if jobs:
            db.add(
                Application(
                    job_id=jobs[0].id,
                    candidate_id=candidate.id,
                    cover_letter="I've shipped data platforms end-to-end. Here's the evidence.",
                    status="reviewing",
                )
            )
        if len(jobs) > 1:
            conv = Conversation(
                job_id=jobs[1].id,
                candidate_id=candidate.id,
                employer_id=jobs[1].employer_id,
            )
            db.add(conv)
            db.flush()
            db.add(
                Message(
                    conversation_id=conv.id,
                    sender_id=jobs[1].employer_id,
                    body="Hi Maya, loved the design system rebuild case study. Could we chat this week?",
                )
            )
            db.add(
                Message(
                    conversation_id=conv.id,
                    sender_id=candidate.id,
                    body="Thanks! I'm free Thursday afternoon — happy to walk through the metrics.",
                )
            )

        db.commit()
        print(
            f"Seeded {len(CANDIDATES)} candidates, {len(EMPLOYERS)} employers, "
            f"{len(jobs)} jobs, {len(skill_map)} skills."
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed()
