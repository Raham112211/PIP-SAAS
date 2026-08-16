import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "PIP SaaS - Organization Service"
    API_V1_STR: str = ""
    DATABASE_URL: str = "sqlite:///./pip_saas.db"
    SECRET_KEY: str = "super-secret-jwt-key-for-pip-saas-2026-production-ready"
    ENVIRONMENT: str = "production"

    model_config = SettingsConfigDict(
        env_file=[str(BASE_DIR / ".env"), ".env"],
        extra="ignore"
    )

    @model_validator(mode="after")
    def validate_database_url(self):
        is_vercel = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
        if is_vercel and self.DATABASE_URL.startswith("sqlite"):
            self.DATABASE_URL = "sqlite:////tmp/pip_saas.db"
        return self


settings = Settings()
