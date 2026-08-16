import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Dynamically resolve Backend root directory for 100% cross-platform compatibility (Windows + Linux + Docker)
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_DB_PATH = BASE_DIR / "pip_saas.db"
DEFAULT_DB_URL = f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"


class Settings(BaseSettings):
    PROJECT_NAME: str = "PIP SaaS - User Service"
    API_V1_STR: str = ""
    DATABASE_URL: str = DEFAULT_DB_URL
    SECRET_KEY: str = "super-secret-jwt-key-for-pip-saas-2026-production-ready"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ENVIRONMENT: str = "production"

    model_config = SettingsConfigDict(
        env_file=[str(BASE_DIR / ".env"), ".env"],
        extra="ignore"
    )


settings = Settings()
