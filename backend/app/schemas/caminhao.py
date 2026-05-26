from pydantic import BaseModel, ConfigDict


class CaminhaoBase(BaseModel):
    plate: str
    description: str | None = None


class CaminhaoCreate(CaminhaoBase):
    pass


class CaminhaoRead(CaminhaoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
