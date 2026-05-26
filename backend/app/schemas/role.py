from typing import List

from pydantic import BaseModel, ConfigDict

from app.schemas.permission import PermissionRead


class RoleBase(BaseModel):
    name: str


class RoleCreate(RoleBase):
    permission_names: List[str] = []


class RoleUpdate(BaseModel):
    name: str | None = None
    permission_names: List[str] | None = None


class RoleRead(RoleBase):
    id: int
    permissions: List[PermissionRead] = []

    model_config = ConfigDict(from_attributes=True)
