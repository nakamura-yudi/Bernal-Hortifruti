from pydantic import BaseModel, ConfigDict


class ServiceBase(BaseModel):
    name: str
    unit_price: float
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceRead(ServiceBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
