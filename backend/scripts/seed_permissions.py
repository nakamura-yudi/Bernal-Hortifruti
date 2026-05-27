#!/usr/bin/env python3
"""Sincroniza as permissões padrão com o banco de dados.

- Cria permissões que estão em DEFAULT_PERMISSIONS mas não no banco.
- Remove permissões que estão no banco mas não estão mais em DEFAULT_PERMISSIONS.
- Mantém intactas quaisquer permissões customizadas (não listadas no DEFAULT_PERMISSIONS).
"""

from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import select

from app.db.seed import DEFAULT_PERMISSIONS
from app.db.session import SessionLocal
from app.models.permission import Permission
from app.services.permission_service import PermissionService


def main() -> int:
    expected = set(DEFAULT_PERMISSIONS)

    with SessionLocal() as session:
        permission_service = PermissionService(session)

        existing_objs = session.scalars(select(Permission)).all()
        existing_names = {p.name for p in existing_objs}

        to_create = expected - existing_names
        to_remove = existing_names - expected  # apenas as que foram padrão e foram removidas da config

        created = 0
        for name in sorted(to_create):
            permission_service.get_or_create(name)
            created += 1

        removed = 0
        for obj in existing_objs:
            if obj.name in to_remove:
                session.delete(obj)
                removed += 1

        session.commit()

    print("=" * 60)
    print("Sync de permissões concluído")
    print("=" * 60)
    print(f"Esperadas (DEFAULT_PERMISSIONS).: {len(expected)}")
    print(f"Criadas...........................: {created}")
    print(f"Removidas.........................: {removed}")
    print(f"Inalteradas.......................: {len(expected) - created}")
    print("=" * 60)

    if to_create:
        print("Criadas:", ", ".join(sorted(to_create)))
    if to_remove:
        print("Removidas:", ", ".join(sorted(to_remove)))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
