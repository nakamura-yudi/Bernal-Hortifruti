from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.carga import Carga
from app.models.conta_firma import ContaFirma
from app.models.firma import Firma
from app.models.frete import Frete
from app.schemas.conta_firma import (
    ContaFirmaCreate,
    ContaFirmaGerarPayload,
    ContaFirmaRead,
    ContaGeradaResult,
    ContaPagarPayload,
)

router = APIRouter(prefix="/contas-firma", tags=["Contas Firma"])


@router.get("", response_model=list[ContaFirmaRead])
def list_contas(
    firma_id: int | None = Query(default=None),
    data_de: date | None = Query(default=None),
    data_ate: date | None = Query(default=None),
    status_filtro: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("conta:view")),
) -> list[ContaFirmaRead]:
    q = select(ContaFirma).order_by(ContaFirma.data_emissao.desc())
    if firma_id:
        q = q.where(ContaFirma.firma_id == firma_id)
    if data_de:
        q = q.where(ContaFirma.data_emissao >= data_de)
    if data_ate:
        q = q.where(ContaFirma.data_emissao <= data_ate)
    if status_filtro == "pendente":
        q = q.where(ContaFirma.data_pagamento.is_(None))
    elif status_filtro == "pago":
        q = q.where(ContaFirma.data_pagamento.is_not(None))
    contas = db.scalars(q).all()
    return [ContaFirmaRead.model_validate(c) for c in contas]


@router.post("", response_model=ContaFirmaRead, status_code=status.HTTP_201_CREATED)
def create_conta(
    payload: ContaFirmaCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("conta:edit")),
) -> ContaFirmaRead:
    if not db.get(Firma, payload.firma_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Firma não encontrada")
    if payload.carga_id and not db.get(Carga, payload.carga_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carga não encontrada")
    conta = ContaFirma(**payload.model_dump())
    db.add(conta)
    db.commit()
    db.refresh(conta)
    return ContaFirmaRead.model_validate(conta)


@router.post("/gerar", response_model=ContaGeradaResult, status_code=status.HTTP_201_CREATED)
def gerar_contas(
    payload: ContaFirmaGerarPayload,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("conta:edit")),
) -> ContaGeradaResult:
    carga = db.get(Carga, payload.carga_id)
    if not carga:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carga não encontrada")

    fretes = db.scalars(select(Frete).where(Frete.carga_id == payload.carga_id)).all()
    if not fretes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Nenhum frete encontrado para esta carga")

    por_firma: dict[int, list] = defaultdict(list)
    for f in fretes:
        por_firma[f.company_id].append(f)

    criadas: list[ContaFirma] = []
    ignoradas = 0
    hoje = date.today()

    for firma_id, lista in por_firma.items():
        existente = db.scalar(
            select(ContaFirma).where(
                ContaFirma.firma_id == firma_id,
                ContaFirma.carga_id == payload.carga_id,
            )
        )
        if existente:
            ignoradas += 1
            continue

        total = sum(float(f.total_amount) for f in lista)
        load_date_fmt = carga.load_date.strftime("%d/%m/%Y")
        firma = db.get(Firma, firma_id)
        firma_name = firma.name if firma else str(firma_id)

        conta = ContaFirma(
            firma_id=firma_id,
            carga_id=payload.carga_id,
            descricao=f"Fretes - Carga #{payload.carga_id} - {load_date_fmt} - {firma_name}",
            valor_total=total,
            data_emissao=hoje,
        )
        db.add(conta)
        criadas.append(conta)

    db.commit()
    for c in criadas:
        db.refresh(c)

    return ContaGeradaResult(
        criadas=len(criadas),
        ignoradas=ignoradas,
        contas=[ContaFirmaRead.model_validate(c) for c in criadas],
    )


@router.patch("/{conta_id}/pagar", response_model=ContaFirmaRead)
def pagar_conta(
    conta_id: int,
    payload: ContaPagarPayload,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("conta:edit")),
) -> ContaFirmaRead:
    conta = db.get(ContaFirma, conta_id)
    if not conta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conta não encontrada")
    conta.data_pagamento = payload.data_pagamento
    db.commit()
    db.refresh(conta)
    return ContaFirmaRead.model_validate(conta)


@router.delete("/{conta_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conta(
    conta_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("conta:edit")),
) -> None:
    conta = db.get(ContaFirma, conta_id)
    if not conta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conta não encontrada")
    db.delete(conta)
    db.commit()
