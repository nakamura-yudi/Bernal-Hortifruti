from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.produtor import Produtor
from app.schemas.produtor import ProdutorCreate, ProdutorRead

router = APIRouter(prefix="/producers", tags=["Produtores"])


@router.get("", response_model=list[ProdutorRead])
def list_produtores(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("producer:view")),
) -> list[ProdutorRead]:
    produtores = db.scalars(select(Produtor).order_by(Produtor.name)).all()
    return [ProdutorRead.model_validate(item) for item in produtores]


@router.post("", response_model=ProdutorRead, status_code=status.HTTP_201_CREATED)
def create_produtor(
    payload: ProdutorCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("producer:edit")),
) -> ProdutorRead:
    if payload.document:
        existing = db.scalar(select(Produtor).where(Produtor.document == payload.document))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Producer document already exists"
            )
    produtor = Produtor(
        name=payload.name,
        document=payload.document,
        state_registration=payload.state_registration,
        city=payload.city,
        contact=payload.contact,
    )
    db.add(produtor)
    db.commit()
    db.refresh(produtor)
    return ProdutorRead.model_validate(produtor)


@router.put("/{produtor_id}", response_model=ProdutorRead)
def update_produtor(
    produtor_id: int,
    payload: ProdutorCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("producer:edit")),
) -> ProdutorRead:
    produtor = db.get(Produtor, produtor_id)
    if not produtor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producer not found")
    if payload.document and payload.document != produtor.document:
        existing = db.scalar(select(Produtor).where(Produtor.document == payload.document))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Producer document already exists"
            )
    produtor.name = payload.name
    produtor.document = payload.document
    produtor.state_registration = payload.state_registration
    produtor.city = payload.city
    produtor.contact = payload.contact
    db.commit()
    db.refresh(produtor)
    return ProdutorRead.model_validate(produtor)


@router.delete("/{produtor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_produtor(
    produtor_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("producer:edit")),
) -> None:
    produtor = db.get(Produtor, produtor_id)
    if not produtor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producer not found")
    db.delete(produtor)
    db.commit()
