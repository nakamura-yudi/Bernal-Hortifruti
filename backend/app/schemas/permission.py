from pydantic import BaseModel, ConfigDict


class PermissionBase(BaseModel):
    name: str


class PermissionCreate(PermissionBase):
    pass


class PermissionRead(PermissionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
