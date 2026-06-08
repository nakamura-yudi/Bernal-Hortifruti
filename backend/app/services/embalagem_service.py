"""Service layer for embalagem operations."""

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.embalagem import Embalagem


def expand_components(db: Session, package_type_id: int, quantity: float) -> list[dict]:
    """Return one {package_type_id, quantity} entry for each component of the given package type."""
    pkg = db.scalars(
        select(Embalagem)
        .options(joinedload(Embalagem.components))
        .where(Embalagem.id == package_type_id)
    ).first()
    if not pkg:
        return []
    return [
        {"package_type_id": c.component_id, "quantity": quantity * float(c.quantity)}
        for c in pkg.components
    ]
