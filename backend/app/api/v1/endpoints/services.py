from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceRead

router = APIRouter(prefix="/services", tags=["Services"])


@router.get("", response_model=list[ServiceRead])
def list_services(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("service:view")),
) -> list[ServiceRead]:
    services = db.scalars(select(Service).order_by(Service.name)).all()
    return [ServiceRead.model_validate(item) for item in services]


@router.post("", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("service:edit")),
) -> ServiceRead:
    service = Service(name=payload.name, unit_price=payload.unit_price, is_active=payload.is_active)
    db.add(service)
    db.commit()
    db.refresh(service)
    return ServiceRead.model_validate(service)


@router.put("/{service_id}", response_model=ServiceRead)
def update_service(
    service_id: int,
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("service:edit")),
) -> ServiceRead:
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    service.name = payload.name
    service.unit_price = payload.unit_price
    service.is_active = payload.is_active
    db.commit()
    db.refresh(service)
    return ServiceRead.model_validate(service)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("service:edit")),
) -> None:
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    db.delete(service)
    db.commit()
