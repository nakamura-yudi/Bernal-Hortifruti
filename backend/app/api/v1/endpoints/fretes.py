from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.frete import Frete
from app.schemas.frete import FreteCreate, FreteRead
from app.services.frete_service import FreteService

router = APIRouter(prefix="/fretes", tags=["Fretes"])


@router.get("", response_model=list[FreteRead])
def list_fretes(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("freight:view")),
) -> list[FreteRead]:
    fretes = db.scalars(select(Frete).order_by(Frete.created_at.desc())).all()
    return [FreteRead.model_validate(item) for item in fretes]


@router.post("", response_model=FreteRead, status_code=status.HTTP_201_CREATED)
def create_frete(
    payload: FreteCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("freight:create")),
) -> FreteRead:
    service = FreteService(db)
    try:
        frete = service.create_frete(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return FreteRead.model_validate(frete)


@router.put("/{frete_id}", response_model=FreteRead)
def update_frete(
    frete_id: int,
    payload: FreteCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("freight:edit")),
) -> FreteRead:
    service = FreteService(db)
    try:
        frete = service.update_frete(frete_id, payload)
    except ValueError as exc:
        detail = str(exc)
        status_code = status.HTTP_404_NOT_FOUND if "not found" in detail.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail) from exc
    return FreteRead.model_validate(frete)


@router.delete("/{frete_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_frete(
    frete_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("freight:edit")),
) -> None:
    frete = db.get(Frete, frete_id)
    if not frete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Frete not found")
    db.delete(frete)
    db.commit()
