"""Helpers for issuing and clearing auth cookies."""

from datetime import datetime, timezone

from fastapi import Response

from app.core.config import Settings, get_settings


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    access_expires_at: datetime,
    refresh_expires_at: datetime,
    settings: Settings | None = None,
) -> None:
    settings = settings or get_settings()
    response.set_cookie(
        key=settings.access_token_cookie_name,
        value=access_token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        domain=settings.auth_cookie_domain,
        path="/",
        max_age=max(0, int((access_expires_at - datetime.now(timezone.utc)).total_seconds())),
    )
    response.set_cookie(
        key=settings.refresh_token_cookie_name,
        value=refresh_token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        domain=settings.auth_cookie_domain,
        path="/",
        max_age=max(0, int((refresh_expires_at - datetime.now(timezone.utc)).total_seconds())),
    )


def clear_auth_cookies(response: Response, settings: Settings | None = None) -> None:
    settings = settings or get_settings()
    response.delete_cookie(
        key=settings.access_token_cookie_name,
        domain=settings.auth_cookie_domain,
        path="/",
    )
    response.delete_cookie(
        key=settings.refresh_token_cookie_name,
        domain=settings.auth_cookie_domain,
        path="/",
    )
