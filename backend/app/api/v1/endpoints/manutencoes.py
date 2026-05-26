from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.manutencao import Manutencao
from app.models.tipo_manutencao import TipoManutencao
from app.models.veiculo import Veiculo
from app.schemas.manutencao import ManutencaoCreate, ManutencaoRead

router = APIRouter(prefix="/manutencoes", tags=["Manutencoes"])


@router.get("", response_model=list[ManutencaoRead])
def list_manutencoes(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("maintenance:view")),
) -> list[ManutencaoRead]:
    manutencoes = db.scalars(select(Manutencao).order_by(Manutencao.data_realizacao.desc(), Manutencao.id.desc())).all()
    return [ManutencaoRead.model_validate(item) for item in manutencoes]


@router.post("", response_model=ManutencaoRead, status_code=status.HTTP_201_CREATED)
def create_manutencao(
    payload: ManutencaoCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("maintenance:edit")),
) -> ManutencaoRead:
    if not db.get(Veiculo, payload.veiculo_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    if not db.get(TipoManutencao, payload.tipo_manutencao_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance type not found")
    manutencao = Manutencao(
        veiculo_id=payload.veiculo_id,
        tipo_manutencao_id=payload.tipo_manutencao_id,
        data_realizacao=payload.data_realizacao,
        km_veiculo=payload.km_veiculo,
        valor=payload.valor,
        oficina=payload.oficina,
        observacoes=payload.observacoes,
    )
    db.add(manutencao)
    db.commit()
    db.refresh(manutencao)
    return ManutencaoRead.model_validate(manutencao)


@router.put("/{manutencao_id}", response_model=ManutencaoRead)
def update_manutencao(
    manutencao_id: int,
    payload: ManutencaoCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("maintenance:edit")),
) -> ManutencaoRead:
    manutencao = db.get(Manutencao, manutencao_id)
    if not manutencao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")
    if not db.get(Veiculo, payload.veiculo_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    if not db.get(TipoManutencao, payload.tipo_manutencao_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance type not found")
    manutencao.veiculo_id = payload.veiculo_id
    manutencao.tipo_manutencao_id = payload.tipo_manutencao_id
    manutencao.data_realizacao = payload.data_realizacao
    manutencao.km_veiculo = payload.km_veiculo
    manutencao.valor = payload.valor
    manutencao.oficina = payload.oficina
    manutencao.observacoes = payload.observacoes
    db.commit()
    db.refresh(manutencao)
    return ManutencaoRead.model_validate(manutencao)


@router.delete("/{manutencao_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_manutencao(
    manutencao_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("maintenance:edit")),
) -> None:
    manutencao = db.get(Manutencao, manutencao_id)
    if not manutencao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")
    db.delete(manutencao)
    db.commit()
