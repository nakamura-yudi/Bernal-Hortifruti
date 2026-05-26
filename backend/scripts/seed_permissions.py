#!/usr/bin/env python3
"""Seed default RBAC permissions."""

from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.db.seed import DEFAULT_PERMISSIONS
from app.db.session import SessionLocal
from app.services.permission_service import PermissionService


def main() -> int:
    with SessionLocal() as session:
        permission_service = PermissionService(session)
        created = 0

        for permission_name in DEFAULT_PERMISSIONS:
            existing = permission_service.get_by_name(permission_name)
            if existing:
                continue
            permission_service.get_or_create(permission_name)
            created += 1

        session.commit()

    print("=" * 60)
    print("Seed de permissões concluído")
    print("=" * 60)
    print(f"Permissões padrão.....: {len(DEFAULT_PERMISSIONS)}")
    print(f"Permissões criadas....: {created}")
    print(f"Permissões existentes.: {len(DEFAULT_PERMISSIONS) - created}")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
