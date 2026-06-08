from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ContaFirmaCreate(BaseModel):
    firma_id: int
    carga_id: int | None = None
    descricao: str | None = None
    valor_total: float = Field(gt=0)
    data_emissao: date
    observacao: str | None = None


class ContaFirmaGerarPayload(BaseModel):
    carga_id: int


class ContaPagarPayload(BaseModel):
    data_pagamento: date


class FirmaSimples(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class CargaSimples(BaseModel):
    id: int
    load_date: date
    model_config = ConfigDict(from_attributes=True)


class ContaFirmaRead(BaseModel):
    id: int
    firma_id: int
    firma: FirmaSimples
    carga_id: int | None
    carga: CargaSimples | None
    descricao: str | None
    valor_total: float
    data_emissao: date
    data_pagamento: date | None
    observacao: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContaGeradaResult(BaseModel):
    criadas: int
    ignoradas: int
    contas: list[ContaFirmaRead]
