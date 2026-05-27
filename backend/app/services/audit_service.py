"""Service layer for writing and querying audit log entries."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


class AuditService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def log(
        self,
        action: str,
        *,
        user_id: int | None = None,
        user_email: str | None = None,
        user_name: str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        ip_address: str | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            user_id=user_id,
            user_email=user_email,
            user_name=user_name,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
        )
        self.session.add(entry)
        self.session.flush()
        return entry

    def list(
        self,
        *,
        action: str | None = None,
        resource_type: str | None = None,
        user_email: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[AuditLog], int]:
        query = select(AuditLog)

        if action:
            query = query.where(AuditLog.action == action)
        if resource_type:
            query = query.where(AuditLog.resource_type == resource_type)
        if user_email:
            query = query.where(AuditLog.user_email.ilike(f"%{user_email}%"))
        if date_from:
            query = query.where(AuditLog.created_at >= date_from)
        if date_to:
            query = query.where(AuditLog.created_at <= date_to)

        total = self.session.scalar(
            select(func.count()).select_from(query.subquery())
        ) or 0

        entries = self.session.scalars(
            query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
        ).all()

        return list(entries), total
