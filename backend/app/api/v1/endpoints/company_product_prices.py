from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.company_product_price import CompanyProductPrice
from app.models.produto import Produto
from app.models.produtor import Produtor
from app.schemas.company_product_price import (
    CompanyProductPriceCreate,
    CompanyProductPriceRead,
    CompanyProductPriceUpdate,
)

router = APIRouter(prefix="/producer-product-prices", tags=["Producer Product Prices"])


@router.get("", response_model=list[CompanyProductPriceRead])
def list_company_product_prices(
    producer_id: int | None = Query(default=None),
    product_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:view")),
) -> list[CompanyProductPriceRead]:
    query = select(CompanyProductPrice)
    if producer_id is not None:
        query = query.where(CompanyProductPrice.producer_id == producer_id)
    if product_id is not None:
        query = query.where(CompanyProductPrice.product_id == product_id)
    prices = db.scalars(query.order_by(CompanyProductPrice.id.desc())).all()
    return [CompanyProductPriceRead.model_validate(item) for item in prices]


@router.post("", response_model=CompanyProductPriceRead, status_code=status.HTTP_201_CREATED)
def create_company_product_price(
    payload: CompanyProductPriceCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:edit")),
) -> CompanyProductPriceRead:
    if not db.get(Produtor, payload.producer_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producer not found")
    if not db.get(Produto, payload.product_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    price = CompanyProductPrice(
        producer_id=payload.producer_id,
        product_id=payload.product_id,
        unit_price=payload.unit_price,
        unit=payload.unit,
    )
    db.add(price)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A price already exists for this producer and product",
        ) from exc
    db.refresh(price)
    return CompanyProductPriceRead.model_validate(price)


@router.put("/{price_id}", response_model=CompanyProductPriceRead)
def update_company_product_price(
    price_id: int,
    payload: CompanyProductPriceUpdate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:edit")),
) -> CompanyProductPriceRead:
    price = db.get(CompanyProductPrice, price_id)
    if not price:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price not found")
    if not db.get(Produtor, payload.producer_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producer not found")
    if not db.get(Produto, payload.product_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    price.producer_id = payload.producer_id
    price.product_id = payload.product_id
    price.unit_price = payload.unit_price
    price.unit = payload.unit
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A price already exists for this producer and product",
        ) from exc
    db.refresh(price)
    return CompanyProductPriceRead.model_validate(price)


@router.delete("/{price_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company_product_price(
    price_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:edit")),
) -> None:
    price = db.get(CompanyProductPrice, price_id)
    if not price:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price not found")
    db.delete(price)
    db.commit()
