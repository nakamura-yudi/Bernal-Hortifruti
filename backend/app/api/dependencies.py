"""Common FastAPI dependencies (db, auth, RBAC)."""

from collections.abc import Generator

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import decode_token
from app.db.session import SessionLocal
from app.models.user import User
from app.services.user_service import UserService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_app_settings() -> Settings:
    return get_settings()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    settings = get_settings()
    token = token or request.cookies.get(settings.access_token_cookie_name)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_token(token)
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    subject = payload.get("sub")
    token_type = payload.get("type")
    if not subject or token_type != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = UserService(db).get_by_email(subject)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def _collect_role_names(user: User) -> set[str]:
    return {role.name.upper() for role in user.roles}


def _collect_permissions(user: User) -> set[str]:
    permissions: set[str] = set()
    for role in user.roles:
        permissions.update(permission.name for permission in role.permissions)
    permissions.update(permission.name for permission in user.permissions)
    return permissions


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if "ADMIN" not in _collect_role_names(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


def require_permissions(*permission_names: str):
    required = {name for name in permission_names if name}

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        role_names = _collect_role_names(current_user)
        if "ADMIN" in role_names:
            return current_user
        user_permissions = _collect_permissions(current_user)
        if not required.issubset(user_permissions):
            missing = sorted(required - user_permissions)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permissions: {', '.join(missing)}",
            )
        return current_user

    return dependency


__all__ = [
    "get_app_settings",
    "get_db",
    "get_current_user",
    "get_current_admin_user",
    "require_permissions",
]
