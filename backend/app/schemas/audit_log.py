"""Pydantic schemas for audit log entries."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogRead(BaseModel):
    id: int
    user_id: int | None
    user_email: str | None
    user_name: str | None
    action: str
    resource_type: str | None
    resource_id: str | None
    ip_address: str | None
    details: dict | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogPage(BaseModel):
    items: list[AuditLogRead]
    total: int
    skip: int
    limit: int
