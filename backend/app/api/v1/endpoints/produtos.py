from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.produto import Produto
from app.models.service import Service
from app.schemas.produto import ProdutoCreate, ProdutoRead, ProductServicesUpdate
from app.schemas.service import ServiceRead

router = APIRouter(prefix="/products", tags=["Produtos"])


@router.get("", response_model=list[ProdutoRead])
def list_produtos(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("product:view")),
) -> list[ProdutoRead]:
    produtos = db.scalars(select(Produto).order_by(Produto.name)).all()
    return [ProdutoRead.model_validate(item) for item in produtos]


@router.post("", response_model=ProdutoRead, status_code=status.HTTP_201_CREATED)
def create_produto(
    payload: ProdutoCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("product:edit")),
) -> ProdutoRead:
    produto = Produto(name=payload.name, default_unit=payload.default_unit)
    db.add(produto)
    db.commit()
    db.refresh(produto)
    return ProdutoRead.model_validate(produto)


@router.get("/{produto_id}/services", response_model=list[ServiceRead])
def list_product_services(
    produto_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("product:view")),
) -> list[ServiceRead]:
    produto = db.get(Produto, produto_id)
    if not produto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return [ServiceRead.model_validate(item) for item in produto.services]


@router.put("/{produto_id}/services", response_model=list[ServiceRead])
def update_product_services(
    produto_id: int,
    payload: ProductServicesUpdate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("product:edit")),
) -> list[ServiceRead]:
    produto = db.get(Produto, produto_id)
    if not produto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    services = db.scalars(select(Service).where(Service.id.in_(payload.service_ids))).all()
    produto.services = list(services)
    db.commit()
    db.refresh(produto)
    return [ServiceRead.model_validate(item) for item in produto.services]


@router.put("/{produto_id}", response_model=ProdutoRead)
def update_produto(
    produto_id: int,
    payload: ProdutoCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("product:edit")),
) -> ProdutoRead:
    produto = db.get(Produto, produto_id)
    if not produto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    produto.name = payload.name
    produto.default_unit = payload.default_unit
    db.commit()
    db.refresh(produto)
    return ProdutoRead.model_validate(produto)


@router.delete("/{produto_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_produto(
    produto_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("product:edit")),
) -> None:
    produto = db.get(Produto, produto_id)
    if not produto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    db.delete(produto)
    db.commit()
