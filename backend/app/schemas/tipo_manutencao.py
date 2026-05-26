from pydantic import BaseModel, ConfigDict


class TipoManutencaoBase(BaseModel):
    nome: str
    descricao: str | None = None
    periodicidade_km: int | None = None
    periodicidade_dias: int | None = None


class TipoManutencaoCreate(TipoManutencaoBase):
    pass


class TipoManutencaoRead(TipoManutencaoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
