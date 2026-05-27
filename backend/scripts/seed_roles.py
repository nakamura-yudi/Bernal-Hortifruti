#!/usr/bin/env python3
"""Sincroniza os perfis padrão e seus vínculos de permissão com o banco de dados.

- Cria perfis que estão em ROLE_PERMISSIONS mas não no banco.
- Remove perfis que estão no banco mas não estão mais em ROLE_PERMISSIONS.
- Para cada perfil, adiciona permissões faltando e remove as que saíram da config.
"""

from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.seed import DEFAULT_PERMISSIONS, ROLE_PERMISSIONS
from app.db.session import SessionLocal
from app.models.permission import Permission
from app.models.role import Role
from app.services.permission_service import PermissionService
from app.services.role_service import RoleService


def main() -> int:
    expected_role_names = set(ROLE_PERMISSIONS.keys())

    with SessionLocal() as session:
        permission_service = PermissionService(session)
        role_service = RoleService(session)

        # Garante que todas as permissões do DEFAULT_PERMISSIONS existem
        all_permissions: dict[str, Permission] = {
            name: permission_service.get_or_create(name) for name in DEFAULT_PERMISSIONS
        }

        existing_roles = session.scalars(
            select(Role).options(selectinload(Role.permissions))
        ).all()
        existing_role_names = {r.name for r in existing_roles}
        existing_roles_by_name = {r.name: r for r in existing_roles}

        roles_created = 0
        roles_removed = 0
        roles_updated = 0

        # Criar perfis novos
        to_create = expected_role_names - existing_role_names
        for name in sorted(to_create):
            role_service.get_or_create(name)
            roles_created += 1

        # Remover perfis que saíram da config
        to_remove = existing_role_names - expected_role_names
        for name in sorted(to_remove):
            session.delete(existing_roles_by_name[name])
            roles_removed += 1

        # Sincronizar permissões de cada perfil
        for role_name, perm_names in ROLE_PERMISSIONS.items():
            role = role_service.get_by_name(role_name)
            if not role:
                # Recém criado, busca novamente
                session.flush()
                role = role_service.get_by_name(role_name)

            expected_perms = {all_permissions[n] for n in perm_names if n in all_permissions}
            current_perms = set(role.permissions)

            to_add = expected_perms - current_perms
            to_unlink = current_perms - expected_perms

            changed = False
            for perm in to_add:
                role.permissions.append(perm)
                changed = True
            for perm in to_unlink:
                role.permissions.remove(perm)
                changed = True

            if changed and role_name not in to_create:
                roles_updated += 1

        session.commit()

    print("=" * 60)
    print("Sync de perfis concluído")
    print("=" * 60)
    print(f"Esperados (ROLE_PERMISSIONS).: {len(ROLE_PERMISSIONS)}")
    print(f"Criados......................: {roles_created}")
    print(f"Atualizados (vínculos).......: {roles_updated}")
    print(f"Removidos....................: {roles_removed}")
    print(f"Inalterados..................: {len(ROLE_PERMISSIONS) - roles_created - roles_updated}")
    print("=" * 60)

    if to_create:
        print("Criados:", ", ".join(sorted(to_create)))
    if to_remove:
        print("Removidos:", ", ".join(sorted(to_remove)))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
