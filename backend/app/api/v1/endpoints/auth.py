from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_app_settings, get_current_user, get_db
from app.core.auth_cookies import clear_auth_cookies, set_auth_cookies
from app.core.config import Settings
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import AuthLoginRequest, ChangePasswordRequest, RefreshTokenRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(
    payload: AuthLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> TokenResponse:
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(payload.login, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    access_token, access_expires_at, refresh_token, refresh_expires_at = auth_service.create_token_pair(user)
    set_auth_cookies(response, access_token, refresh_token, access_expires_at, refresh_expires_at, settings)

    forwarded = request.headers.get("X-Forwarded-For")
    ip = (forwarded.split(",")[0].strip() if forwarded else None) or (request.client.host if request.client else None)
    AuditService(db).log(
        "login",
        user_id=user.id,
        user_email=user.email,
        user_name=user.name,
        resource_type="auth",
        ip_address=ip,
        details={"perfis": [r.name for r in user.roles]},
    )

    db.commit()
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=UserRead.model_validate(user))


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    request: Request,
    response: Response,
    payload: RefreshTokenRequest | None = None,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> TokenResponse:
    auth_service = AuthService(db)
    refresh_token_value = payload.refresh_token if payload and payload.refresh_token else None
    if not refresh_token_value:
        refresh_token_value = request.cookies.get(settings.refresh_token_cookie_name)
    if not refresh_token_value:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token required")
    try:
        user, access_token, access_expires_at, new_refresh_token, refresh_expires_at = auth_service.refresh_access_token(
            refresh_token_value
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

    set_auth_cookies(response, access_token, new_refresh_token, access_expires_at, refresh_expires_at, settings)
    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token, user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> None:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is invalid")
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    current_user.password_hash = get_password_hash(payload.new_password)
    current_user.password_changed_at = datetime.now(timezone.utc)
    db.commit()
    AuthService(db).revoke_user_sessions(current_user.id)
    clear_auth_cookies(response, settings)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    request: Request,
    payload: RefreshTokenRequest | None = None,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> None:
    refresh_token_value = payload.refresh_token if payload and payload.refresh_token else None
    if not refresh_token_value:
        refresh_token_value = request.cookies.get(settings.refresh_token_cookie_name)
    AuthService(db).revoke_refresh_token(refresh_token_value)
    clear_auth_cookies(response, settings)
