import httpx

from app.core.config import settings


class SupabaseAuthError(Exception):
    def __init__(self, message: str, code: int = 401):
        self.message = message
        self.code = code
        super().__init__(message)


class Supabase:
    """Minimal client for Supabase Auth + Storage using the REST APIs."""

    def __init__(self):
        self.url = settings.supabase_url.rstrip("/")
        self.anon = settings.supabase_anon_key
        self.service = settings.supabase_service_role_key
        self.bucket = settings.storage_bucket

    def _client(self, key: str) -> httpx.Client:
        return httpx.Client(
            base_url=self.url,
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            timeout=30,
        )

    def _storage_client(self, key: str) -> httpx.Client:
        return httpx.Client(
            base_url=self.url,
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
            timeout=60,
        )

    def sign_up(self, email: str, password: str, name: str) -> dict:
        with self._client(self.service) as c:
            r = c.post(
                "/auth/v1/admin/users",
                json={
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {"name": name},
                },
            )
        if r.status_code >= 400:
            raise SupabaseAuthError(r.json().get("msg", "Signup failed"), r.status_code)
        data = r.json()
        # admin/users returns the user object directly; normalize to {"user": ...}
        return {"user": data}

    def sign_in(self, email: str, password: str) -> dict:
        with self._client(self.anon) as c:
            r = c.post(
                "/auth/v1/token?grant_type=password",
                json={"email": email, "password": password},
            )
        if r.status_code >= 400:
            raise SupabaseAuthError("Invalid email or password", 401)
        return r.json()

    def refresh(self, refresh_token: str) -> dict:
        with self._client(self.anon) as c:
            r = c.post(
                "/auth/v1/token?grant_type=refresh_token",
                json={"refresh_token": refresh_token},
            )
        if r.status_code >= 400:
            raise SupabaseAuthError("Session expired", 401)
        return r.json()

    def get_user(self, access_token: str) -> dict:
        with httpx.Client(
            base_url=self.url,
            headers={"apikey": self.anon, "Authorization": f"Bearer {access_token}"},
            timeout=30,
        ) as c:
            r = c.get("/auth/v1/user")
        if r.status_code >= 400:
            raise SupabaseAuthError("Invalid token", 401)
        return r.json()

    def ensure_bucket(self) -> None:
        with self._storage_client(self.service) as c:
            r = c.get(f"/storage/v1/bucket/{self.bucket}")
            if r.status_code == 200:
                return
            r = c.post("/storage/v1/bucket", json={"id": self.bucket, "name": self.bucket, "public": True})
            if r.status_code >= 400 and r.status_code != 409:
                raise SupabaseAuthError(r.json().get("message", "Bucket setup failed"), r.status_code)

    def upload(self, object_name: str, data: bytes, content_type: str) -> str:
        path = f"/storage/v1/object/{self.bucket}/{object_name}"
        with self._storage_client(self.service) as c:
            c.headers["Content-Type"] = content_type
            r = c.post(path, content=data)
        if r.status_code >= 400:
            raise SupabaseAuthError(r.json().get("message", "Upload failed"), r.status_code)
        return f"{self.url}/storage/v1/object/public/{self.bucket}/{object_name}"


supabase = Supabase()
