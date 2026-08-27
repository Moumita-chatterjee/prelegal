import secrets
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_path: str = "data/app.db"
    # No hardcoded fallback: since the database is recreated from scratch on
    # every container start, tokens never need to outlive one run, so a fresh
    # random secret per process is simpler and safer than a shared default.
    # Set JWT_SECRET explicitly if tokens must stay valid across restarts.
    jwt_secret: str = Field(default_factory=lambda: secrets.token_hex(32))
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24
    static_dir: str = "static"
    openrouter_api_key: str = ""

    @property
    def database_url(self) -> str:
        return f"sqlite:///{self.database_path}"

    @property
    def static_path(self) -> Path:
        return Path(self.static_dir)


settings = Settings()
