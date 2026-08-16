import os
import tempfile
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import Optional

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
TMP_DB_PATH = Path(tempfile.gettempdir()) / "pip_saas.db"
DEFAULT_DB_URL = f"sqlite:///{TMP_DB_PATH.as_posix()}" if is_serverless else f"sqlite:///{(ROOT_DIR / 'pip_saas.db').as_posix()}"


class Settings(BaseSettings):
    PROJECT_NAME: str = "PIP SaaS - User Service"
    API_V1_STR: str = ""
    DATABASE_URL: str = DEFAULT_DB_URL
    SECRET_KEY: str = "super-secret-jwt-key-for-pip-saas-2026-production-ready"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ENVIRONMENT: str = "production"

    model_config = SettingsConfigDict(
        env_file=[str(ROOT_DIR / ".env"), str(BASE_DIR / ".env"), ".env"],
        extra="ignore"
    )

    @model_validator(mode="after")
    def validate_database_url(self):
        is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
        if is_serverless and self.DATABASE_URL.startswith("sqlite"):
            tmp_db = Path(tempfile.gettempdir()) / "pip_saas.db"
            self.DATABASE_URL = f"sqlite:///{tmp_db.as_posix()}"
        return self


settings = Settings()
