from pydantic import BaseModel, ConfigDict


class FirmaBase(BaseModel):
    name: str
    document: str | None = None
    state_registration: str | None = None
    city: str | None = None
    contact: str | None = None


class FirmaCreate(FirmaBase):
    pass


class FirmaRead(FirmaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
