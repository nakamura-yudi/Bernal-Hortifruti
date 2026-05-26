from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserRead


class AuthLoginRequest(BaseModel):
    login: str
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead

    model_config = ConfigDict(from_attributes=True)
