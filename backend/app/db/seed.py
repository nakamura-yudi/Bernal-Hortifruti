"""Seed RBAC data (roles, permissions, admin user)."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.services.permission_service import PermissionService
from app.services.role_service import RoleService
from app.services.user_service import UserService


@dataclass(frozen=True)
class RBACSeedConfig:
    admin_email: str
    admin_password: str
    admin_name: str = "Admin"


DEFAULT_PERMISSIONS = [
    "freight:create",
    "freight:edit",
    "freight:view",
    "trip:create",
    "trip:edit",
    "trip:view",
    "package:move",
    "report:view",
    "report:delete",
    "charge:edit",
    "producer:view",
    "producer:edit",
    "company:view",
    "company:edit",
    "product:view",
    "product:edit",
    "vehicle:view",
    "vehicle:edit",
    "service:view",
    "service:edit",
    "maintenance:view",
    "maintenance:edit",
    "price:view",
    "price:edit",
]

ROLE_PERMISSIONS = {
    "ADMIN": DEFAULT_PERMISSIONS,
    "OPERADOR": [
        "freight:create",
        "freight:edit",
        "freight:view",
        "trip:create",
        "trip:edit",
        "trip:view",
        "package:move",
        "producer:view",
        "company:view",
        "product:view",
        "vehicle:view",
        "service:view",
        "maintenance:view",
        "price:view",
    ],
    "FINANCEIRO": [
        "freight:view",
        "report:view",
        "charge:edit",
        "trip:view",
        "producer:view",
        "company:view",
        "product:view",
        "price:view",
    ],
}


def seed_rbac(session: Session, config: RBACSeedConfig) -> None:
    permission_service = PermissionService(session)
    role_service = RoleService(session)
    user_service = UserService(session)

    permissions = {name: permission_service.get_or_create(name) for name in DEFAULT_PERMISSIONS}
    roles = {name: role_service.get_or_create(name) for name in ROLE_PERMISSIONS.keys()}

    for role_name, perm_names in ROLE_PERMISSIONS.items():
        role = roles[role_name]
        for perm_name in perm_names:
            role_service.assign_permission(role, permissions[perm_name])

    admin_user = user_service.get_by_email(config.admin_email)
    if not admin_user:
        admin_user = user_service.create(
            name=config.admin_name,
            email=config.admin_email,
            password=config.admin_password,
            is_active=True,
        )
    user_service.assign_role(admin_user, roles["ADMIN"])

    session.commit()


__all__ = ["RBACSeedConfig", "seed_rbac"]
