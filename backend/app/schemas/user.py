from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.permission import PermissionRead
from app.schemas.role import RoleRead


class UserBase(BaseModel):
    name: str
    email: EmailStr
    is_active: bool = True


class UserCreate(UserBase):
    password: str
    role_names: List[str] = []


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    is_active: bool | None = None
    password: str | None = None
    role_names: List[str] | None = None


class UserPermissionsUpdate(BaseModel):
    permission_names: List[str]


class ResetPasswordRequest(BaseModel):
    new_password: str


class UserRead(UserBase):
    id: int
    created_at: datetime
    roles: List[RoleRead] = []
    permissions: List[PermissionRead] = []

    model_config = ConfigDict(from_attributes=True)
