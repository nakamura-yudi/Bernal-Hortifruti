from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.package_stock_entry import PackageStockEntry
from app.schemas.package_stock import PackageStockEntryCreate, PackageStockEntryRead

router = APIRouter(prefix="/package-stock", tags=["PackageStock"])


@router.get("", response_model=list[PackageStockEntryRead])
def list_package_stock_entries(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("package:move")),
) -> list[PackageStockEntryRead]:
    entries = db.scalars(
        select(PackageStockEntry).order_by(PackageStockEntry.created_at.desc())
    ).all()
    return [PackageStockEntryRead.model_validate(item) for item in entries]


@router.post("", response_model=PackageStockEntryRead, status_code=status.HTTP_201_CREATED)
def create_package_stock_entry(
    payload: PackageStockEntryCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("package:move")),
) -> PackageStockEntryRead:
    entry = PackageStockEntry(
        package_type_id=payload.package_type_id,
        quantity=payload.quantity,
    )
    db.add(entry)
    try:
        db.commit()
    except Exception as exc:  # pragma: no cover - basic constraint guard
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    db.refresh(entry)
    return PackageStockEntryRead.model_validate(entry)
