"""Service layer implementation for permission service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.permission import Permission


class PermissionService:
    """Permission persistence helpers for RBAC workflows."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_name(self, name: str) -> Permission | None:
        return self.session.scalar(select(Permission).where(Permission.name == name))

    def get_or_create(self, name: str) -> Permission:
        permission = self.get_by_name(name)
        if permission:
            return permission
        permission = Permission(name=name)
        self.session.add(permission)
        self.session.flush()
        return permission
