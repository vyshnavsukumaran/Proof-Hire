from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "ProofHire API"
    database_url: str = "sqlite:///./proofhire.db"
    db_schema: str = ""
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    storage_bucket: str = "uploads"
    secret_key: str = "proofhire-dev-secret-change-me"
    access_token_expire_minutes: int = 60 * 24 * 7
    algorithm: str = "HS256"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    upload_dir: str = "./uploads"
    max_upload_bytes: int = 5 * 1024 * 1024


settings = Settings()
