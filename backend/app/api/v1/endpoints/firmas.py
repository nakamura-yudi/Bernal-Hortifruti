from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.firma import Firma
from app.schemas.firma import FirmaCreate, FirmaRead

router = APIRouter(prefix="/companies", tags=["Firmas"])


@router.get("", response_model=list[FirmaRead])
def list_firmas(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("company:view")),
) -> list[FirmaRead]:
    firmas = db.scalars(select(Firma).order_by(Firma.name)).all()
    return [FirmaRead.model_validate(item) for item in firmas]


@router.post("", response_model=FirmaRead, status_code=status.HTTP_201_CREATED)
def create_firma(
    payload: FirmaCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("company:edit")),
) -> FirmaRead:
    if payload.document:
        existing = db.scalar(select(Firma).where(Firma.document == payload.document))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Company document already exists"
            )
    firma = Firma(
        name=payload.name,
        document=payload.document,
        state_registration=payload.state_registration,
        city=payload.city,
        contact=payload.contact,
    )
    db.add(firma)
    db.commit()
    db.refresh(firma)
    return FirmaRead.model_validate(firma)


@router.put("/{firma_id}", response_model=FirmaRead)
def update_firma(
    firma_id: int,
    payload: FirmaCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("company:edit")),
) -> FirmaRead:
    firma = db.get(Firma, firma_id)
    if not firma:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    if payload.document and payload.document != firma.document:
        existing = db.scalar(select(Firma).where(Firma.document == payload.document))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Company document already exists"
            )
    firma.name = payload.name
    firma.document = payload.document
    firma.state_registration = payload.state_registration
    firma.city = payload.city
    firma.contact = payload.contact
    db.commit()
    db.refresh(firma)
    return FirmaRead.model_validate(firma)


@router.delete("/{firma_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_firma(
    firma_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("company:edit")),
) -> None:
    firma = db.get(Firma, firma_id)
    if not firma:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    db.delete(firma)
    db.commit()
