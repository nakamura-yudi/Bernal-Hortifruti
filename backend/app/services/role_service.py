"""Service layer implementation for role service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.role import Role


class RoleService:
    """Role persistence helpers for RBAC workflows."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_name(self, name: str) -> Role | None:
        return self.session.scalar(select(Role).where(Role.name == name))

    def get_or_create(self, name: str) -> Role:
        role = self.get_by_name(name)
        if role:
            return role
        role = Role(name=name)
        self.session.add(role)
        self.session.flush()
        return role

    def assign_permission(self, role: Role, permission: Permission) -> None:
        if permission not in role.permissions:
            role.permissions.append(permission)
