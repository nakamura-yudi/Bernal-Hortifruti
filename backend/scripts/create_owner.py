#!/usr/bin/env python3
"""Create an Owner user with full access (interactive).

This script prompts for email, name, and password, validates input,
creates the user if missing, and assigns the ADMIN role.
"""

from __future__ import annotations

import getpass
import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User
from app.services.role_service import RoleService
from app.services.user_service import UserService


def validate_email(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_password(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r"[A-Z]", password):
        return False, "Password must include an uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must include a lowercase letter"
    if not re.search(r"[0-9]", password):
        return False, "Password must include a number"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must include a special character"
    return True, ""


def prompt_user() -> tuple[str, str, str]:
    print("=" * 70)
    print("Bernal Transportadora - Create Owner User")
    print("=" * 70)
    print("\nThis user will have full access.")
    print("Password rules: 8+ chars, upper/lower, number, symbol.\n")

    while True:
        email = input("Email: ").strip().lower()
        if not email:
            print("Email is required.\n")
            continue
        if not validate_email(email):
            print("Invalid email format.\n")
            continue
        break

    while True:
        name = input("Full name: ").strip()
        if not name:
            print("Name is required.\n")
            continue
        if len(name) < 3:
            print("Name must be at least 3 characters.\n")
            continue
        break

    while True:
        password = getpass.getpass("Password: ")
        if not password:
            print("Password is required.\n")
            continue
        valid, error = validate_password(password)
        if not valid:
            print(f"{error}\n")
            continue
        confirm = getpass.getpass("Confirm password: ")
        if confirm != password:
            print("Passwords do not match.\n")
            continue
        break

    return email, name, password


def create_owner(email: str, name: str, password: str) -> None:
    with SessionLocal() as session:
        existing = session.scalar(select(User).where(User.email == email))
        if existing:
            print(f"User with email '{email}' already exists (id={existing.id}).")
            return

        user_service = UserService(session)
        role_service = RoleService(session)
        admin_role = role_service.get_or_create("ADMIN")

        user = user_service.create(name=name, email=email, password=password, is_active=True)
        user_service.assign_role(user, admin_role)
        session.commit()

        print("\nOwner user created successfully!")
        print("=" * 70)
        print(f"User.......: {user.name} ({user.email})")
        print(f"User ID....: {user.id}")
        print("=" * 70)


def main() -> int:
    try:
        email, name, password = prompt_user()
        confirm = input("\nConfirm creation (yes/no)? ").strip().lower()
        if confirm not in {"yes", "y"}:
            print("Operation cancelled.")
            return 0
        create_owner(email, name, password)
        return 0
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
