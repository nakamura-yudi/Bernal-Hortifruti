from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.package_delivery import PackageDelivery
from app.schemas.package_delivery import PackageDeliveryCreate, PackageDeliveryRead

router = APIRouter(prefix="/package-deliveries", tags=["PackageDeliveries"])


@router.get("", response_model=list[PackageDeliveryRead])
def list_package_deliveries(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("package:move")),
) -> list[PackageDeliveryRead]:
    deliveries = db.scalars(select(PackageDelivery).order_by(PackageDelivery.created_at.desc())).all()
    return [PackageDeliveryRead.model_validate(item) for item in deliveries]


@router.post("", response_model=PackageDeliveryRead, status_code=status.HTTP_201_CREATED)
def create_package_delivery(
    payload: PackageDeliveryCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("package:move")),
) -> PackageDeliveryRead:
    delivery = PackageDelivery(
        producer_id=payload.producer_id,
        package_type_id=payload.package_type_id,
        quantity=payload.quantity,
    )
    db.add(delivery)
    try:
        db.commit()
    except Exception as exc:  # pragma: no cover - basic constraint guard
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    db.refresh(delivery)
    return PackageDeliveryRead.model_validate(delivery)
