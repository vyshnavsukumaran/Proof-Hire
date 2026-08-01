# ProofHire

Portfolio-based hiring platform. Candidates show real projects, outcomes, and
skills; employers search and hire on evidence instead of résumés.

**Stack:** Next.js 16 (frontend) · FastAPI (backend) · SQLite locally
(Supabase/Postgres-ready via SQLAlchemy) · JWT auth in httpOnly cookies.

## Structure

```
ProofHire/
  backend/   FastAPI app (models, schemas, routers, services, seed)
  frontend/  Next.js app (App Router + Tailwind, neo-brutalist UI)
```

## Prerequisites

- Python 3.12+ and [uv](https://docs.astral.sh/uv/)
- Node.js 20+

## Run the backend

```bash
cd backend
uv venv .venv
uv pip install -e .
.venv/bin/python -m app.seed      # optional: load demo data
.venv/bin/uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Demo accounts (after seeding)

| Role      | Email                  | Password     |
| --------- | ---------------------- | ------------ |
| Candidate | maya@demo.proofhire    | password123  |
| Candidate | diego@demo.proofhire   | password123  |
| Employer  | hiring@nimbuslabs.demo | password123  |
| Employer  | jobs@fieldworkstudio.demo | password123 |

### Backend tests

```bash
cd backend
.venv/bin/python -m pytest tests/ -q
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

The frontend proxies `/api/*` to the FastAPI backend (default
`http://localhost:8000`, override with `BACKEND_URL`). The JWT is stored in an
httpOnly cookie by the proxy.

### Frontend checks

```bash
npm run lint
npm run build
```

## Features

- **Role-based auth** — candidates and employers register separately
- **Portfolio builder** — problem → contribution → process → outcome projects,
  skill tagging, draft/live publishing, completion rail
- **Discovery & search** — filter talent and jobs by skill, location,
  availability, level, remote
- **Rule-based matching** — recommendations for both sides from skill overlap
- **Applications** — apply with portfolio evidence, full status workflow
  (applied → reviewing → interview → offer/rejected)
- **Employer shortlist** — save/pass/request-interview with match score
- **Messaging** — per-job conversations, unread counts, 5s polling
- **Portfolio analytics** — views, likes, application funnel, top projects

## Switching to Postgres/Supabase

Models avoid Postgres-specific types. Point the backend at Supabase by setting
`DATABASE_URL`:

```bash
DATABASE_URL=postgresql+psycopg://... uvicorn app.main:app
```

Then run `python -m app.seed` against the new database if you want demo data.
