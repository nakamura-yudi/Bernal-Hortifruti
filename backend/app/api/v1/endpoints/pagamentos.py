from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.firma import Firma
from app.models.pagamento import LotePagamento, Pagamento
from app.models.produtor import Produtor
from app.schemas.pagamento import (
    LotePagamentoCreate,
    LotePagamentoRead,
    LotePagamentoUpdate,
    PagamentoItemCreate,
    PagamentoItemUpdate,
    PagamentoItemRead,
)

router = APIRouter(prefix="/lotes-pagamento", tags=["Pagamentos"])


@router.get("", response_model=list[LotePagamentoRead])
def list_lotes(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("payment:view")),
) -> list[LotePagamentoRead]:
    lotes = db.scalars(select(LotePagamento).order_by(LotePagamento.data_chegada.desc())).all()
    return [LotePagamentoRead.model_validate(lote) for lote in lotes]


@router.get("/{lote_id}", response_model=LotePagamentoRead)
def get_lote(
    lote_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("payment:view")),
) -> LotePagamentoRead:
    lote = db.get(LotePagamento, lote_id)
    if not lote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote de pagamento não encontrado")
    return LotePagamentoRead.model_validate(lote)


@router.post("", response_model=LotePagamentoRead, status_code=status.HTTP_201_CREATED)
def create_lote(
    payload: LotePagamentoCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("payment:edit")),
) -> LotePagamentoRead:
    firma = db.get(Firma, payload.firma_id)
    if not firma:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Firma não encontrada")

    for item in payload.itens:
        if item.produtor_id is not None and not db.get(Produtor, item.produtor_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Produtor {item.produtor_id} não encontrado")

    lote = LotePagamento(
        firma_id=payload.firma_id,
        data_chegada=payload.data_chegada,
        observacao=payload.observacao,
    )
    db.add(lote)
    db.flush()

    for item in payload.itens:
        pagamento = Pagamento(
            lote_id=lote.id,
            produtor_id=item.produtor_id,
            valor=item.valor,
            data_entrega=item.data_entrega,
            observacao=item.observacao,
        )
        db.add(pagamento)

    db.commit()
    db.refresh(lote)
    return LotePagamentoRead.model_validate(lote)


@router.put("/{lote_id}", response_model=LotePagamentoRead)
def update_lote(
    lote_id: int,
    payload: LotePagamentoUpdate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("payment:edit")),
) -> LotePagamentoRead:
    lote = db.get(LotePagamento, lote_id)
    if not lote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote de pagamento não encontrado")

    if not db.get(Firma, payload.firma_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Firma não encontrada")

    lote.firma_id = payload.firma_id
    lote.data_chegada = payload.data_chegada
    lote.observacao = payload.observacao
    db.commit()
    db.refresh(lote)
    return LotePagamentoRead.model_validate(lote)


@router.delete("/{lote_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lote(
    lote_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("payment:edit")),
) -> None:
    lote = db.get(LotePagamento, lote_id)
    if not lote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote de pagamento não encontrado")
    db.delete(lote)
    db.commit()


@router.post("/{lote_id}/itens", response_model=PagamentoItemRead, status_code=status.HTTP_201_CREATED)
def create_item(
    lote_id: int,
    payload: PagamentoItemCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("payment:edit")),
) -> PagamentoItemRead:
    lote = db.get(LotePagamento, lote_id)
    if not lote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote de pagamento não encontrado")
    if payload.produtor_id is not None and not db.get(Produtor, payload.produtor_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produtor não encontrado")
    item = Pagamento(
        lote_id=lote_id,
        produtor_id=payload.produtor_id,
        valor=payload.valor,
        data_entrega=payload.data_entrega,
        observacao=payload.observacao,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return PagamentoItemRead.model_validate(item)


@router.patch("/{lote_id}/itens/{item_id}", response_model=PagamentoItemRead)
def update_item(
    lote_id: int,
    item_id: int,
    payload: PagamentoItemUpdate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("payment:edit")),
) -> PagamentoItemRead:
    item = db.scalar(
        select(Pagamento).where(Pagamento.id == item_id, Pagamento.lote_id == lote_id)
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado")

    if payload.produtor_id is not None and not db.get(Produtor, payload.produtor_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produtor não encontrado")
    if payload.produtor_id is not None:
        item.produtor_id = payload.produtor_id
    if payload.valor is not None:
        item.valor = payload.valor
    item.data_entrega = payload.data_entrega
    item.observacao = payload.observacao
    db.commit()
    db.refresh(item)
    return PagamentoItemRead.model_validate(item)
