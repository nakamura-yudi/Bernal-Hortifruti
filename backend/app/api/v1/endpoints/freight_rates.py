from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.frete import FreightServiceRate
from app.schemas.freight_rate import FreightRateCreate, FreightRateRead

router = APIRouter(prefix="/freight-service-rates", tags=["Freight Rates"])


@router.get("", response_model=list[FreightRateRead])
def list_rates(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:view")),
) -> list[FreightRateRead]:
    rates = db.scalars(select(FreightServiceRate)).all()
    return [FreightRateRead.model_validate(item) for item in rates]


@router.post("", response_model=FreightRateRead, status_code=status.HTTP_201_CREATED)
def create_rate(
    payload: FreightRateCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:edit")),
) -> FreightRateRead:
    rate = FreightServiceRate(product_id=payload.product_id, rate_per_unit=payload.rate_per_unit)
    db.add(rate)
    db.commit()
    db.refresh(rate)
    return FreightRateRead.model_validate(rate)


@router.put("/{rate_id}", response_model=FreightRateRead)
def update_rate(
    rate_id: int,
    payload: FreightRateCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:edit")),
) -> FreightRateRead:
    rate = db.get(FreightServiceRate, rate_id)
    if not rate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rate not found")
    rate.product_id = payload.product_id
    rate.rate_per_unit = payload.rate_per_unit
    db.commit()
    db.refresh(rate)
    return FreightRateRead.model_validate(rate)


@router.delete("/{rate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rate(
    rate_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:edit")),
) -> None:
    rate = db.get(FreightServiceRate, rate_id)
    if not rate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rate not found")
    db.delete(rate)
    db.commit()
