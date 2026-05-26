from pydantic import BaseModel, ConfigDict


class ProdutorBase(BaseModel):
    name: str
    document: str | None = None
    state_registration: str | None = None
    city: str | None = None
    contact: str | None = None


class ProdutorCreate(ProdutorBase):
    pass


class ProdutorRead(ProdutorBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
