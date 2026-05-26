from pydantic import BaseModel, ConfigDict


class ProdutoBase(BaseModel):
    name: str
    default_unit: str = "caixa"


class ProdutoCreate(ProdutoBase):
    pass


class ProdutoRead(ProdutoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ProductServicesUpdate(BaseModel):
    service_ids: list[int] = []
