from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.veiculo import Veiculo
from app.schemas.veiculo import VeiculoCreate, VeiculoRead

router = APIRouter(prefix="/veiculos", tags=["Veiculos"])


@router.get("", response_model=list[VeiculoRead])
def list_veiculos(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("vehicle:view")),
) -> list[VeiculoRead]:
    veiculos = db.scalars(select(Veiculo).order_by(Veiculo.plate)).all()
    return [VeiculoRead.model_validate(item) for item in veiculos]


@router.post("", response_model=VeiculoRead, status_code=status.HTTP_201_CREATED)
def create_veiculo(
    payload: VeiculoCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("vehicle:edit")),
) -> VeiculoRead:
    existing = db.scalar(select(Veiculo).where(Veiculo.plate == payload.plate))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vehicle plate already exists")
    veiculo = Veiculo(
        plate=payload.plate.upper(),
        model=payload.model,
        brand=payload.brand,
        year=payload.year,
        type=payload.type,
        current_km=payload.current_km,
        status=payload.status,
        is_third_party=payload.is_third_party,
        notes=payload.notes,
    )
    db.add(veiculo)
    db.commit()
    db.refresh(veiculo)
    return VeiculoRead.model_validate(veiculo)


@router.put("/{veiculo_id}", response_model=VeiculoRead)
def update_veiculo(
    veiculo_id: int,
    payload: VeiculoCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("vehicle:edit")),
) -> VeiculoRead:
    veiculo = db.get(Veiculo, veiculo_id)
    if not veiculo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    if payload.plate and payload.plate != veiculo.plate:
        existing = db.scalar(select(Veiculo).where(Veiculo.plate == payload.plate))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vehicle plate already exists")
    veiculo.plate = payload.plate.upper()
    veiculo.model = payload.model
    veiculo.brand = payload.brand
    veiculo.year = payload.year
    veiculo.type = payload.type
    veiculo.current_km = payload.current_km
    veiculo.status = payload.status
    veiculo.is_third_party = payload.is_third_party
    veiculo.notes = payload.notes
    db.commit()
    db.refresh(veiculo)
    return VeiculoRead.model_validate(veiculo)


@router.delete("/{veiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_veiculo(
    veiculo_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("vehicle:edit")),
) -> None:
    veiculo = db.get(Veiculo, veiculo_id)
    if not veiculo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    db.delete(veiculo)
    db.commit()
