"""Service layer implementation for auth service."""

from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token, decode_token, verify_password
from app.models.refresh_token_session import RefreshTokenSession
from app.models.user import User
from app.services.user_service import UserService


class AuthService:
    """Authentication helpers."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.user_service = UserService(session)

    def authenticate_user(self, login: str, password: str) -> User | None:
        user = self.user_service.get_by_email(login)
        if not user or not user.is_active:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    def create_token_pair(self, user: User) -> tuple[str, datetime, str, datetime]:
        settings = get_settings()
        access_token = create_access_token(user.email)
        access_expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
        refresh_token, refresh_expires_at, refresh_jti = create_refresh_token(user.email)
        session = RefreshTokenSession(
            jti=refresh_jti,
            user_id=user.id,
            expires_at=refresh_expires_at,
        )
        self.session.add(session)
        self.session.flush()
        return access_token, access_expires_at, refresh_token, refresh_expires_at

    def refresh_access_token(self, refresh_token: str) -> tuple[User, str, datetime, str, datetime]:
        settings = get_settings()
        try:
            payload = decode_token(refresh_token)
        except jwt.PyJWTError as exc:
            raise ValueError("Invalid refresh token") from exc
        if payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")
        subject = payload.get("sub")
        jti = payload.get("jti")
        if not subject or not jti:
            raise ValueError("Invalid refresh token")

        token_session = self.session.get(RefreshTokenSession, jti)
        if not token_session or token_session.revoked_at is not None:
            raise ValueError("Refresh token revoked")
        if token_session.expires_at <= datetime.now(timezone.utc):
            token_session.revoked_at = datetime.now(timezone.utc)
            self.session.commit()
            raise ValueError("Refresh token expired")

        user = self.user_service.get_by_email(subject)
        if not user or not user.is_active or user.id != token_session.user_id:
            raise ValueError("Invalid refresh token")

        token_session.revoked_at = datetime.now(timezone.utc)
        access_token = create_access_token(subject)
        access_expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
        new_refresh_token, refresh_expires_at, new_refresh_jti = create_refresh_token(subject)
        token_session.replaced_by_jti = new_refresh_jti
        new_session = RefreshTokenSession(
            jti=new_refresh_jti,
            user_id=user.id,
            expires_at=refresh_expires_at,
        )
        self.session.add(new_session)
        self.session.commit()
        return user, access_token, access_expires_at, new_refresh_token, refresh_expires_at

    def revoke_refresh_token(self, refresh_token: str | None) -> None:
        if not refresh_token:
            return
        try:
            payload = decode_token(refresh_token)
        except jwt.PyJWTError:
            return
        if payload.get("type") != "refresh":
            return
        jti = payload.get("jti")
        if not jti:
            return
        token_session = self.session.get(RefreshTokenSession, jti)
        if token_session and token_session.revoked_at is None:
            token_session.revoked_at = datetime.now(timezone.utc)
            self.session.commit()

    def revoke_user_sessions(self, user_id: int) -> None:
        active_sessions = (
            self.session.query(RefreshTokenSession)
            .filter(RefreshTokenSession.user_id == user_id, RefreshTokenSession.revoked_at.is_(None))
            .all()
        )
        if not active_sessions:
            return
        revoked_at = datetime.now(timezone.utc)
        for token_session in active_sessions:
            token_session.revoked_at = revoked_at
        self.session.commit()
