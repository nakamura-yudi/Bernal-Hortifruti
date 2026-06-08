from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class PagamentoItemCreate(BaseModel):
    produtor_id: int | None = None
    valor: float | None = Field(default=None, gt=0)
    data_entrega: date | None = None
    observacao: str | None = None


class PagamentoItemUpdate(BaseModel):
    produtor_id: int | None = None
    valor: float | None = Field(default=None, gt=0)
    data_entrega: date | None = None
    observacao: str | None = None


class ProdutorSimples(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class PagamentoItemRead(BaseModel):
    id: int
    lote_id: int
    produtor_id: int | None
    produtor: ProdutorSimples | None
    valor: float | None
    data_entrega: date | None
    observacao: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LotePagamentoCreate(BaseModel):
    firma_id: int
    data_chegada: date
    observacao: str | None = None
    itens: list[PagamentoItemCreate] = Field(default_factory=list)


class LotePagamentoUpdate(BaseModel):
    firma_id: int
    data_chegada: date
    observacao: str | None = None


class FirmaSimples(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class LotePagamentoRead(BaseModel):
    id: int
    firma_id: int
    firma: FirmaSimples
    data_chegada: date
    observacao: str | None
    created_at: datetime
    itens: list[PagamentoItemRead]

    model_config = ConfigDict(from_attributes=True)
