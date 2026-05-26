#!/usr/bin/env python3
"""Seed default RBAC roles and bind permissions."""

from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.db.seed import DEFAULT_PERMISSIONS, ROLE_PERMISSIONS
from app.db.session import SessionLocal
from app.services.permission_service import PermissionService
from app.services.role_service import RoleService


def main() -> int:
    with SessionLocal() as session:
        permission_service = PermissionService(session)
        role_service = RoleService(session)

        permissions = {name: permission_service.get_or_create(name) for name in DEFAULT_PERMISSIONS}
        roles_created = 0

        for role_name, permission_names in ROLE_PERMISSIONS.items():
          existing = role_service.get_by_name(role_name)
          if not existing:
              roles_created += 1
          role = role_service.get_or_create(role_name)
          for permission_name in permission_names:
              role_service.assign_permission(role, permissions[permission_name])

        session.commit()

    print("=" * 60)
    print("Seed de perfis concluído")
    print("=" * 60)
    print(f"Perfis padrão.......: {len(ROLE_PERMISSIONS)}")
    print(f"Perfis criados......: {roles_created}")
    print(f"Perfis existentes...: {len(ROLE_PERMISSIONS) - roles_created}")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
