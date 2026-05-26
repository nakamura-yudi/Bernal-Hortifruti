from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.embalagem import Embalagem
from app.schemas.embalagem import EmbalagemCreate, EmbalagemRead

router = APIRouter(prefix="/package-types", tags=["Embalagens"])


@router.get("", response_model=list[EmbalagemRead])
def list_embalagens(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:view")),
) -> list[EmbalagemRead]:
    embalagens = db.scalars(select(Embalagem).order_by(Embalagem.name)).all()
    return [EmbalagemRead.model_validate(item) for item in embalagens]


@router.post("", response_model=EmbalagemRead, status_code=status.HTTP_201_CREATED)
def create_embalagem(
    payload: EmbalagemCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:edit")),
) -> EmbalagemRead:
    embalagem = Embalagem(name=payload.name, unit_price=payload.unit_price)
    db.add(embalagem)
    db.commit()
    db.refresh(embalagem)
    return EmbalagemRead.model_validate(embalagem)


@router.put("/{embalagem_id}", response_model=EmbalagemRead)
def update_embalagem(
    embalagem_id: int,
    payload: EmbalagemCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:edit")),
) -> EmbalagemRead:
    embalagem = db.get(Embalagem, embalagem_id)
    if not embalagem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package type not found")
    embalagem.name = payload.name
    embalagem.unit_price = payload.unit_price
    db.commit()
    db.refresh(embalagem)
    return EmbalagemRead.model_validate(embalagem)


@router.delete("/{embalagem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_embalagem(
    embalagem_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:edit")),
) -> None:
    embalagem = db.get(Embalagem, embalagem_id)
    if not embalagem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package type not found")
    db.delete(embalagem)
    db.commit()
