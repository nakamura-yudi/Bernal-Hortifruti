from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ManutencaoBase(BaseModel):
    veiculo_id: int
    tipo_manutencao_id: int
    data_realizacao: date
    km_veiculo: float
    valor: float
    oficina: str | None = None
    observacoes: str | None = None


class ManutencaoCreate(ManutencaoBase):
    pass


class ManutencaoRead(ManutencaoBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
