from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.carga import Carga
from app.models.veiculo import Veiculo
from app.models.frete import Frete
from app.schemas.carga import CargaCreate, CargaRead, CargaStatusUpdate

router = APIRouter(prefix="/cargas", tags=["Cargas"])


@router.get("", response_model=list[CargaRead])
def list_cargas(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("trip:view")),
) -> list[CargaRead]:
    cargas = db.scalars(select(Carga).order_by(Carga.load_date.desc(), Carga.id.desc())).all()
    return [CargaRead.model_validate(item) for item in cargas]


@router.post("", response_model=CargaRead, status_code=status.HTTP_201_CREATED)
def create_carga(
    payload: CargaCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("trip:create")),
) -> CargaRead:
    veiculo = db.get(Veiculo, payload.veiculo_id)
    if not veiculo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    carga = Carga(
        load_date=payload.load_date,
        veiculo_id=payload.veiculo_id,
        km_traveled=payload.km_traveled,
        fuel_liters=payload.fuel_liters,
        toll_amount=payload.toll_amount,
        diesel_amount=payload.diesel_amount,
        driver_name=payload.driver_name,
        is_third_party=payload.is_third_party,
        third_party_freight_value=payload.third_party_freight_value,
        status=payload.status,
    )
    db.add(carga)
    db.commit()
    db.refresh(carga)

    if payload.frete_ids:
        fretes = db.scalars(select(Frete).where(Frete.id.in_(payload.frete_ids))).all()
        if len(fretes) != len(set(payload.frete_ids)):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Frete not found")
        for frete in fretes:
            frete.carga_id = carga.id
        db.commit()
        db.refresh(carga)

    return CargaRead.model_validate(carga)


@router.put("/{carga_id}", response_model=CargaRead)
def update_carga(
    carga_id: int,
    payload: CargaCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("trip:edit")),
) -> CargaRead:
    carga = db.get(Carga, carga_id)
    if not carga:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carga not found")
    veiculo = db.get(Veiculo, payload.veiculo_id)
    if not veiculo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    carga.load_date = payload.load_date
    carga.veiculo_id = payload.veiculo_id
    carga.km_traveled = payload.km_traveled
    carga.fuel_liters = payload.fuel_liters
    carga.toll_amount = payload.toll_amount
    carga.diesel_amount = payload.diesel_amount
    carga.driver_name = payload.driver_name
    carga.is_third_party = payload.is_third_party
    carga.third_party_freight_value = payload.third_party_freight_value
    carga.status = payload.status
    db.commit()

    requested_ids = set(payload.frete_ids or [])
    existing_fretes = db.scalars(select(Frete).where(Frete.carga_id == carga.id)).all()
    for frete in existing_fretes:
        if frete.id not in requested_ids:
            frete.carga_id = None

    if requested_ids:
        fretes = db.scalars(select(Frete).where(Frete.id.in_(requested_ids))).all()
        if len(fretes) != len(requested_ids):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Frete not found")
        for frete in fretes:
            frete.carga_id = carga.id

    db.commit()
    db.refresh(carga)
    return CargaRead.model_validate(carga)


@router.patch("/{carga_id}/status", response_model=CargaRead)
def update_carga_status(
    carga_id: int,
    payload: CargaStatusUpdate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("trip:edit")),
) -> CargaRead:
    carga = db.get(Carga, carga_id)
    if not carga:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carga not found")
    carga.status = payload.status
    db.commit()
    db.refresh(carga)
    return CargaRead.model_validate(carga)


@router.delete("/{carga_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_carga(
    carga_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("trip:edit")),
) -> None:
    carga = db.get(Carga, carga_id)
    if not carga:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carga not found")
    fretes = db.scalars(select(Frete).where(Frete.carga_id == carga.id)).all()
    for frete in fretes:
        frete.carga_id = None
    db.delete(carga)
    db.commit()
