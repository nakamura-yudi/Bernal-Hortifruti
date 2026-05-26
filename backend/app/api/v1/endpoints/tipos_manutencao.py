from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.tipo_manutencao import TipoManutencao
from app.schemas.tipo_manutencao import TipoManutencaoCreate, TipoManutencaoRead

router = APIRouter(prefix="/tipos-manutencao", tags=["Tipos Manutencao"])


@router.get("", response_model=list[TipoManutencaoRead])
def list_tipos_manutencao(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("maintenance:view")),
) -> list[TipoManutencaoRead]:
    tipos = db.scalars(select(TipoManutencao).order_by(TipoManutencao.nome)).all()
    return [TipoManutencaoRead.model_validate(item) for item in tipos]


@router.post("", response_model=TipoManutencaoRead, status_code=status.HTTP_201_CREATED)
def create_tipo_manutencao(
    payload: TipoManutencaoCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("maintenance:edit")),
) -> TipoManutencaoRead:
    existing = db.scalar(select(TipoManutencao).where(TipoManutencao.nome == payload.nome))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Maintenance type already exists")
    tipo = TipoManutencao(
        nome=payload.nome,
        descricao=payload.descricao,
        periodicidade_km=payload.periodicidade_km,
        periodicidade_dias=payload.periodicidade_dias,
    )
    db.add(tipo)
    db.commit()
    db.refresh(tipo)
    return TipoManutencaoRead.model_validate(tipo)


@router.put("/{tipo_id}", response_model=TipoManutencaoRead)
def update_tipo_manutencao(
    tipo_id: int,
    payload: TipoManutencaoCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("maintenance:edit")),
) -> TipoManutencaoRead:
    tipo = db.get(TipoManutencao, tipo_id)
    if not tipo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance type not found")
    existing = db.scalar(
        select(TipoManutencao).where(TipoManutencao.nome == payload.nome, TipoManutencao.id != tipo_id)
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Maintenance type already exists")
    tipo.nome = payload.nome
    tipo.descricao = payload.descricao
    tipo.periodicidade_km = payload.periodicidade_km
    tipo.periodicidade_dias = payload.periodicidade_dias
    db.commit()
    db.refresh(tipo)
    return TipoManutencaoRead.model_validate(tipo)


@router.delete("/{tipo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tipo_manutencao(
    tipo_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("maintenance:edit")),
) -> None:
    tipo = db.get(TipoManutencao, tipo_id)
    if not tipo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance type not found")
    db.delete(tipo)
    db.commit()
