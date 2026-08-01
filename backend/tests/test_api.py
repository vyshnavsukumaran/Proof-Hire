def register(client, role, name="Test User", email=None, password="password123"):
    email = email or f"{role}{hash(name) & 0xffff}@test.com"
    return client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": name, "role": role},
    )


def auth_headers(client, role):
    r = register(client, role)
    assert r.status_code == 201, r.text
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_register_and_login(client):
    r = register(client, "candidate", email="cand@test.com")
    assert r.status_code == 201
    data = r.json()
    assert data["role"] == "candidate"
    assert data["access_token"]

    r = client.post("/api/auth/login", data={"username": "cand@test.com", "password": "password123"})
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_me_returns_profile(client):
    headers = auth_headers(client, "candidate")
    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["role"] == "candidate"


def test_candidate_can_create_project(client):
    headers = auth_headers(client, "candidate")
    r = client.post(
        "/api/projects",
        headers=headers,
        json={
            "title": "Portfolio Platform",
            "problem": "Recruiters can't see real work.",
            "outcome": "Hired based on evidence.",
            "skills": ["Python", "FastAPI"],
        },
    )
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["title"] == "Portfolio Platform"
    assert len(data["skills"]) == 2

    r = client.get(f"/api/projects/{data['id']}")
    assert r.status_code == 200
    assert r.json()["likes"] == 0


def test_employer_cannot_create_project(client):
    headers = auth_headers(client, "employer")
    r = client.post("/api/projects", headers=headers, json={"title": "nope"})
    assert r.status_code == 403


def test_duplicate_project_title_rejected(client):
    candidate = auth_headers(client, "candidate")
    r = client.post("/api/projects", headers=candidate, json={"title": "Dupe Proj"})
    assert r.status_code == 201, r.text
    r = client.post("/api/projects", headers=candidate, json={"title": "Dupe Proj"})
    assert r.status_code == 400
    assert "already have a project" in r.json()["detail"]


def test_project_view_tracking(client):
    headers = auth_headers(client, "candidate")
    r = client.post(
        "/api/projects", headers=headers, json={"title": "Tracked Project"}
    )
    pid = r.json()["id"]
    client.post(f"/api/projects/{pid}/view")
    client.post(f"/api/projects/{pid}/like")
    r = client.get(f"/api/projects/{pid}")
    assert r.json()["views"] == 1
    assert r.json()["likes"] == 1


def test_job_lifecycle(client):
    employer = auth_headers(client, "employer")
    r = client.post(
        "/api/jobs",
        headers=employer,
        json={
            "title": "Senior Engineer",
            "required_skills": "Python, FastAPI",
            "remote": True,
        },
    )
    assert r.status_code == 201, r.text
    job = r.json()
    assert job["required_skill_list"] == ["Python", "FastAPI"]

    candidate = auth_headers(client, "candidate")
    r = client.post(
        "/api/applications",
        headers=candidate,
        json={"job_id": job["id"], "cover_letter": "Here is my work."},
    )
    assert r.status_code == 201, r.text
    app = r.json()

    r = client.patch(
        f"/api/applications/{app['id']}/status",
        headers=employer,
        json={"status": "interview"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "interview"

    r = client.get("/api/applications/received", headers=employer)
    assert len(r.json()) == 1


def test_duplicate_application_rejected(client):
    candidate = auth_headers(client, "candidate")
    employer = auth_headers(client, "employer")
    job = client.post(
        "/api/jobs", headers=employer, json={"title": "Engineer"}
    ).json()
    client.post(
        "/api/applications", headers=candidate, json={"job_id": job["id"]}
    )
    r = client.post(
        "/api/applications", headers=candidate, json={"job_id": job["id"]}
    )
    assert r.status_code == 400


def test_messaging(client):
    cand_email = "mc@test.com"
    emp_email = "me@test.com"
    candidate = auth_headers(client, "candidate")
    employer = auth_headers(client, "employer")

    cand_user = client.get("/api/auth/me", headers=candidate).json()
    emp_user = client.get("/api/auth/me", headers=employer).json()

    r = client.post(
        "/api/messaging/conversations",
        headers=candidate,
        json={"candidate_id": cand_user["id"], "employer_id": emp_user["id"]},
    )
    assert r.status_code == 201, r.text
    conv_id = r.json()["id"]

    r = client.post(
        f"/api/messaging/conversations/{conv_id}/messages",
        headers=candidate,
        json={"body": "Hello!"},
    )
    assert r.status_code == 201
    assert r.json()["body"] == "Hello!"

    r = client.get(f"/api/messaging/conversations/{conv_id}/messages", headers=employer)
    assert r.status_code == 200
    assert r.json()[0]["read"] is True

    r = client.get("/api/messaging/conversations", headers=employer)
    assert len(r.json()) == 1
    assert r.json()[0]["unread"] == 0


def test_search_talent(client):
    candidate = auth_headers(client, "candidate")
    me = client.get("/api/auth/me", headers=candidate).json()
    client.patch(
        "/api/auth/me",
        headers=candidate,
        json={
            "headline": "Data Engineer",
            "summary": "I build pipelines.",
            "skills": ["Python", "SQL"],
            "availability": "fulltime",
            "visibility": "live",
        },
    )
    r = client.get("/api/search/talent?skills=Python")
    assert r.status_code == 200
    assert any(u["id"] == me["id"] for u in r.json())


def test_recommendations(client):
    candidate = auth_headers(client, "candidate")
    employer = auth_headers(client, "employer")
    client.patch(
        "/api/auth/me",
        headers=candidate,
        json={"skills": ["Python", "FastAPI"], "availability": "fulltime", "visibility": "live"},
    )
    client.post(
        "/api/jobs",
        headers=employer,
        json={"title": "Python Role", "required_skills": "Python, FastAPI"},
    )
    r = client.get("/api/recommendations/jobs", headers=candidate)
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_shortlist(client):
    candidate = auth_headers(client, "candidate")
    employer = auth_headers(client, "employer")
    cand = client.get("/api/auth/me", headers=candidate).json()

    r = client.post(
        "/api/shortlist",
        headers=employer,
        json={"candidate_id": cand["id"], "notes": "Strong pipeline work"},
    )
    assert r.status_code == 201, r.text
    assert r.json()["notes"] == "Strong pipeline work"

    r = client.get("/api/shortlist", headers=employer)
    assert len(r.json()) == 1
    assert r.json()[0]["candidate"]["name"] == cand["name"]


def test_analytics(client):
    candidate = auth_headers(client, "candidate")
    client.post("/api/projects", headers=candidate, json={"title": "Analytics Proj"})
    r = client.get("/api/users/me/analytics", headers=candidate)
    assert r.status_code == 200
    assert r.json()["application_count"] >= 0


def test_upload_avatar(client):
    candidate = auth_headers(client, "candidate")
    r = client.post(
        "/api/uploads/avatar",
        headers=candidate,
        files={"file": ("me.png", b"\x89PNG\r\n\x1a\nfake", "image/png")},
    )
    assert r.status_code == 200, r.text
    url = r.json()["url"]
    assert "storage/v1/object/public/uploads" in url
    me = client.get("/api/auth/me", headers=candidate).json()
    assert me["avatar_url"] == url


def test_upload_project_media(client):
    candidate = auth_headers(client, "candidate")
    proj = client.post(
        "/api/projects", headers=candidate, json={"title": "Media Proj"}
    ).json()
    r = client.post(
        "/api/uploads/project-media",
        headers=candidate,
        params={"project_id": proj["id"]},
        files={"file": ("shot.png", b"\x89PNG\r\n\x1a\nfake", "image/png")},
    )
    assert r.status_code == 200, r.text
    assert "storage/v1/object/public/uploads" in r.json()["media_url"]
    assert client.get(f"/api/projects/{proj['id']}").json()["media_url"] == r.json()["media_url"]


def test_upload_rejects_bad_type_and_other_users(client):
    candidate = auth_headers(client, "candidate")
    other_r = register(client, "candidate", name="Other User")
    other = {"Authorization": f"Bearer {other_r.json()['access_token']}"}
    proj = client.post(
        "/api/projects", headers=candidate, json={"title": "Private Proj"}
    ).json()

    r = client.post(
        "/api/uploads/avatar",
        headers=candidate,
        files={"file": ("evil.txt", b"hello", "text/plain")},
    )
    assert r.status_code == 400

    r = client.post(
        "/api/uploads/project-media",
        headers=other,
        params={"project_id": proj["id"]},
        files={"file": ("shot.png", b"\x89PNG\r\n\x1a\nfake", "image/png")},
    )
    assert r.status_code == 404
