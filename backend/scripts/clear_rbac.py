#!/usr/bin/env python3
"""Remove todas as permissões e perfis do banco de dados.

Uso:
    python scripts/clear_rbac.py           # pede confirmação
    python scripts/clear_rbac.py --force   # executa sem perguntar
"""

from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import delete, func, select

from app.db.session import SessionLocal
from app.models.associations import role_permissions, user_permissions, user_roles
from app.models.permission import Permission
from app.models.role import Role


def _count(session, model):
    return session.scalar(select(func.count()).select_from(model))


def main() -> int:
    force = "--force" in sys.argv

    with SessionLocal() as session:
        n_roles = _count(session, Role)
        n_permissions = _count(session, Permission)

    print("=" * 60)
    print("Clear RBAC — exclusão de perfis e permissões")
    print("=" * 60)
    print(f"Perfis encontrados......: {n_roles}")
    print(f"Permissões encontradas..: {n_permissions}")
    print("=" * 60)

    if n_roles == 0 and n_permissions == 0:
        print("Nada a excluir.")
        return 0

    if not force:
        print("\nATENÇÃO: esta operação é irreversível.")
        print("Usuários perderão todos os perfis e permissões atribuídos.")
        resposta = input("Digite 'sim' para confirmar: ").strip().lower()
        if resposta != "sim":
            print("Operação cancelada.")
            return 0

    with SessionLocal() as session:
        # 1. Desvincular permissões dos perfis
        session.execute(delete(role_permissions))
        # 2. Desvincular permissões diretas dos usuários
        session.execute(delete(user_permissions))
        # 3. Desvincular perfis dos usuários
        session.execute(delete(user_roles))
        # 4. Excluir perfis
        session.execute(delete(Role))
        # 5. Excluir permissões
        session.execute(delete(Permission))
        session.commit()

    print("\n" + "=" * 60)
    print("Concluído")
    print("=" * 60)
    print(f"Perfis excluídos......: {n_roles}")
    print(f"Permissões excluídas..: {n_permissions}")
    print("=" * 60)
    print("Execute seed_permissions.py e seed_roles.py para recriar.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
