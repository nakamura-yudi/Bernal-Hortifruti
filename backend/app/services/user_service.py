"""Service layer implementation for user service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.role import Role
from app.models.user import User


class UserService:
    """User persistence helpers for RBAC workflows."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_email(self, email: str) -> User | None:
        return self.session.scalar(select(User).where(User.email == email))

    def create(self, name: str, email: str, password: str, is_active: bool = True) -> User:
        user = User(
            name=name,
            email=email,
            password_hash=get_password_hash(password),
            is_active=is_active,
        )
        self.session.add(user)
        self.session.flush()
        return user

    def assign_role(self, user: User, role: Role) -> None:
        if role not in user.roles:
            user.roles.append(role)
