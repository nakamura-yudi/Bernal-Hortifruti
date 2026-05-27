"""Audit log query endpoint — acesso restrito ao ADMIN."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin_user, get_db
from app.schemas.audit_log import AuditLogPage
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("", response_model=AuditLogPage, dependencies=[Depends(get_current_admin_user)])
def list_audit_logs(
    db: Session = Depends(get_db),
    action: str | None = Query(default=None, description="Filtrar por ação"),
    resource_type: str | None = Query(default=None, description="Filtrar por tipo de recurso"),
    user_email: str | None = Query(default=None, description="Filtrar por e-mail (parcial)"),
    date_from: datetime | None = Query(default=None, description="Data inicial (ISO 8601)"),
    date_to: datetime | None = Query(default=None, description="Data final (ISO 8601)"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> AuditLogPage:
    items, total = AuditService(db).list(
        action=action,
        resource_type=resource_type,
        user_email=user_email,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )
    return AuditLogPage(items=items, total=total, skip=skip, limit=limit)
