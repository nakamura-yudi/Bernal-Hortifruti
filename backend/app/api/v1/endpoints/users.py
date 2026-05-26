from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_current_admin_user, get_current_user, get_db
from app.models.permission import Permission
from app.core.security import get_password_hash
from app.models.role import Role
from app.models.user import User
from app.schemas.user import UserCreate, UserPermissionsUpdate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


def _query_users(db: Session):
    return select(User).options(
        selectinload(User.roles).selectinload(Role.permissions),
        selectinload(User.permissions),
    )


def _resolve_roles(db: Session, role_names: list[str]) -> list[Role]:
    normalized = sorted({name.strip().upper() for name in role_names if name and name.strip()})
    if not normalized:
        return []
    roles = db.scalars(select(Role).where(Role.name.in_(normalized))).all()
    if len(roles) != len(normalized):
        found = {role.name for role in roles}
        missing = [name for name in normalized if name not in found]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Roles not found: {', '.join(missing)}",
        )
    return list(roles)


def _resolve_permissions(db: Session, permission_names: list[str]) -> list[Permission]:
    normalized = sorted({name.strip() for name in permission_names if name and name.strip()})
    if not normalized:
        return []
    permissions = db.scalars(select(Permission).where(Permission.name.in_(normalized))).all()
    if len(permissions) != len(normalized):
        found = {permission.name for permission in permissions}
        missing = [name for name in normalized if name not in found]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permissions not found: {', '.join(missing)}",
        )
    return list(permissions)


@router.get("", response_model=list[UserRead], dependencies=[Depends(get_current_admin_user)])
def list_users(db: Session = Depends(get_db)) -> list[UserRead]:
    users = db.scalars(_query_users(db).order_by(User.created_at.desc())).all()
    return [UserRead.model_validate(item) for item in users]


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_admin_user)])
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> UserRead:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User email already exists")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        is_active=payload.is_active,
    )
    if payload.role_names:
        user.roles = _resolve_roles(db, payload.role_names)
    db.add(user)
    db.flush()
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.put("/{user_id}", response_model=UserRead, dependencies=[Depends(get_current_admin_user)])
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserRead:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.email and payload.email != user.email:
        existing = db.scalar(select(User).where(User.email == payload.email))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User email already exists")
        user.email = payload.email

    if payload.name is not None:
        user.name = payload.name
    if payload.is_active is not None:
        if user.id == current_user.id and payload.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate your own user",
            )
        user.is_active = payload.is_active
    if payload.password:
        user.password_hash = get_password_hash(payload.password)
    if payload.role_names is not None:
        user.roles = _resolve_roles(db, payload.role_names)

    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.put(
    "/{user_id}/permissions",
    response_model=UserRead,
    dependencies=[Depends(get_current_admin_user)],
)
def update_user_permissions(
    user_id: int,
    payload: UserPermissionsUpdate,
    db: Session = Depends(get_db),
) -> UserRead:
    user = db.scalar(_query_users(db).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.permissions = _resolve_permissions(db, payload.permission_names)
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin_user)])
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own user")
    db.delete(user)
    db.commit()
