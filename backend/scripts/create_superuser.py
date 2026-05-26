#!/usr/bin/env python3
"""Create or update a superuser account.

Usage:
  python scripts/create_superuser.py --email admin@example.com --password change-me
  python scripts/create_superuser.py --email admin@example.com --prompt-password
"""

from __future__ import annotations

import argparse
import getpass
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.services.role_service import RoleService
from app.services.user_service import UserService


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create or update a superuser")
    parser.add_argument("--email", required=True, help="User email")
    parser.add_argument("--name", default="Admin", help="User display name")
    parser.add_argument("--password", help="User password")
    parser.add_argument(
        "--prompt-password",
        action="store_true",
        help="Prompt for password (recommended)",
    )
    parser.add_argument("--role", default="ADMIN", help="Role name to assign")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.prompt_password:
        password = getpass.getpass("Password: ")
        if not password:
            print("Password is required.")
            return 1
    else:
        password = args.password

    if not password:
        print("Provide --password or --prompt-password")
        return 1

    with SessionLocal() as session:
        user_service = UserService(session)
        role_service = RoleService(session)

        role = role_service.get_or_create(args.role)
        user = user_service.get_by_email(args.email)
        if not user:
            user = user_service.create(args.name, args.email, password, is_active=True)
        else:
            user.name = args.name
            user.password_hash = get_password_hash(password)

        user_service.assign_role(user, role)
        session.commit()

    print(f"Superuser ready: {args.email} (role: {args.role})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
