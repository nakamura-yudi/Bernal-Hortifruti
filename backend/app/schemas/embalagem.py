from pydantic import BaseModel, ConfigDict


class EmbalagemBase(BaseModel):
    name: str
    unit_price: float


class EmbalagemCreate(EmbalagemBase):
    pass


class EmbalagemRead(EmbalagemBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
