"""Security helpers for hashing passwords and generating JWT tokens."""

from datetime import datetime, timedelta, timezone
from typing import Any, Literal
from uuid import uuid4

import jwt
from passlib.context import CryptContext

from app.core.config import Settings, get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


def _create_token(
    subject: str,
    token_type: Literal["access", "refresh"],
    settings: Settings | None = None,
    expires_delta: timedelta | None = None,
) -> tuple[str, datetime, str]:
    settings = settings or get_settings()
    issued_at = datetime.now(timezone.utc)
    expire = issued_at + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    jti = str(uuid4())
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire, "iat": issued_at, "type": token_type, "jti": jti}
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM), expire, jti


def create_access_token(subject: str, settings: Settings | None = None, expires_delta: timedelta | None = None) -> str:
    token, _expire, _jti = _create_token(subject, "access", settings, expires_delta)
    return token


def create_refresh_token(
    subject: str,
    settings: Settings | None = None,
    expires_delta: timedelta | None = None,
) -> tuple[str, datetime, str]:
    settings = settings or get_settings()
    refresh_delta = expires_delta or timedelta(days=settings.refresh_token_expire_days)
    return _create_token(subject, "refresh", settings, refresh_delta)


def decode_token(token: str, settings: Settings | None = None) -> dict[str, Any]:
    settings = settings or get_settings()
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


__all__ = [
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "verify_password",
    "get_password_hash",
]
