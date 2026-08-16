import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Dynamically resolve Backend root directory & Vercel /tmp writeable path
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
is_vercel = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
DEFAULT_DB_PATH = Path("/tmp/pip_saas.db") if is_vercel else BASE_DIR / "pip_saas.db"
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
