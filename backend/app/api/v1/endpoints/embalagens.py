from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_db, require_permissions
from app.models.embalagem import Embalagem, PackageTypeComponent
from app.schemas.embalagem import EmbalagemCreate, EmbalagemRead, PackageTypeComponentRead

router = APIRouter(prefix="/package-types", tags=["Embalagens"])


def _load_all(db: Session) -> list[Embalagem]:
    return db.scalars(
        select(Embalagem)
        .options(joinedload(Embalagem.components).joinedload(PackageTypeComponent.component))
        .order_by(Embalagem.name)
    ).unique().all()


def _to_read(embalagem: Embalagem) -> EmbalagemRead:
    comps = [
        PackageTypeComponentRead(
            id=c.id,
            component_id=c.component_id,
            component_name=c.component.name,
            quantity=float(c.quantity),
        )
        for c in embalagem.components
    ]
    return EmbalagemRead(
        id=embalagem.id,
        name=embalagem.name,
        unit_price=float(embalagem.unit_price),
        components=comps,
    )


def _sync_components(db: Session, embalagem: Embalagem, components_in: list) -> None:
    embalagem.components.clear()
    for comp in components_in:
        embalagem.components.append(
            PackageTypeComponent(
                component_id=comp.component_id,
                quantity=comp.quantity,
            )
        )


@router.get("", response_model=list[EmbalagemRead])
def list_embalagens(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:view")),
) -> list[EmbalagemRead]:
    return [_to_read(e) for e in _load_all(db)]


@router.post("", response_model=EmbalagemRead, status_code=status.HTTP_201_CREATED)
def create_embalagem(
    payload: EmbalagemCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:edit")),
) -> EmbalagemRead:
    embalagem = Embalagem(name=payload.name, unit_price=payload.unit_price)
    db.add(embalagem)
    db.flush()
    _sync_components(db, embalagem, payload.components)
    db.commit()
    db.refresh(embalagem)
    # reload with eager load
    embalagem = db.scalars(
        select(Embalagem)
        .options(joinedload(Embalagem.components).joinedload(PackageTypeComponent.component))
        .where(Embalagem.id == embalagem.id)
    ).unique().first()
    return _to_read(embalagem)


@router.put("/{embalagem_id}", response_model=EmbalagemRead)
def update_embalagem(
    embalagem_id: int,
    payload: EmbalagemCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:edit")),
) -> EmbalagemRead:
    embalagem = db.scalars(
        select(Embalagem)
        .options(joinedload(Embalagem.components).joinedload(PackageTypeComponent.component))
        .where(Embalagem.id == embalagem_id)
    ).unique().first()
    if not embalagem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package type not found")
    embalagem.name = payload.name
    embalagem.unit_price = payload.unit_price
    _sync_components(db, embalagem, payload.components)
    db.commit()
    db.refresh(embalagem)
    embalagem = db.scalars(
        select(Embalagem)
        .options(joinedload(Embalagem.components).joinedload(PackageTypeComponent.component))
        .where(Embalagem.id == embalagem_id)
    ).unique().first()
    return _to_read(embalagem)


@router.delete("/{embalagem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_embalagem(
    embalagem_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("price:edit")),
) -> None:
    embalagem = db.get(Embalagem, embalagem_id)
    if not embalagem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package type not found")
    db.delete(embalagem)
    db.commit()
