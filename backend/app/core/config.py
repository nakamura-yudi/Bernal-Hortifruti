from functools import lru_cache
import json

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "Bernal Transportadora API"
    version: str = "0.1.0"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://postgres:postgres@db:5432/transportadora"
    secret_key: str
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    access_token_cookie_name: str = "access_token"
    refresh_token_cookie_name: str = "refresh_token"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"
    auth_cookie_domain: str | None = None
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]
    allowed_hosts: list[str] = ["localhost", "127.0.0.1"]
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 120
    rate_limit_window_seconds: int = 60
    auth_rate_limit_requests: int = 10
    auth_rate_limit_window_seconds: int = 60
    security_headers_enabled: bool = True
    content_security_policy: str | None = None
    permissions_policy: str = "geolocation=(), microphone=(), camera=()"
    referrer_policy: str = "strict-origin-when-cross-origin"
    frame_options: str = "DENY"
    content_type_options: str = "nosniff"
    hsts_enabled: bool = False
    hsts_max_age: int = 31536000
    hsts_include_subdomains: bool = True
    hsts_preload: bool = False
    force_https_redirect: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> list[str]:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return [str(item) for item in parsed]
            except json.JSONDecodeError:
                return [origin.strip() for origin in value.split(",") if origin.strip()]
        return []

    @field_validator("allowed_hosts", mode="before")
    @classmethod
    def parse_allowed_hosts(cls, value: object) -> list[str]:
        if isinstance(value, list):
            return [str(item) for item in value if str(item).strip()]
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return [str(item) for item in parsed if str(item).strip()]
            except json.JSONDecodeError:
                return [host.strip() for host in value.split(",") if host.strip()]
        return []

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        if not value or value == "change-me":
            raise ValueError("SECRET_KEY must be configured with a non-default value")
        if len(value) < 32:
            raise ValueError("SECRET_KEY must have at least 32 characters")
        return value

    @field_validator("auth_cookie_samesite")
    @classmethod
    def validate_cookie_samesite(cls, value: str) -> str:
        normalized = value.lower()
        if normalized not in {"lax", "strict", "none"}:
            raise ValueError("AUTH_COOKIE_SAMESITE must be one of: lax, strict, none")
        return normalized

    @field_validator("frame_options")
    @classmethod
    def validate_frame_options(cls, value: str) -> str:
        normalized = value.upper()
        if normalized not in {"DENY", "SAMEORIGIN"}:
            raise ValueError("FRAME_OPTIONS must be DENY or SAMEORIGIN")
        return normalized


@lru_cache
def get_settings() -> Settings:
    return Settings()
