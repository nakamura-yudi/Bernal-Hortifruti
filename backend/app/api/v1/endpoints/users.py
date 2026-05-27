from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_current_admin_user, get_current_user, get_db
from app.models.permission import Permission
from app.core.security import get_password_hash
from app.models.role import Role
from app.models.user import User
from app.schemas.user import ResetPasswordRequest, UserCreate, UserPermissionsUpdate, UserRead, UserUpdate
from app.services.auth_service import AuthService

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
def create_user(payload: UserCreate, request: Request, db: Session = Depends(get_db)) -> UserRead:
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

    request.state.audit_details = {
        "nome": user.name,
        "email": user.email,
        "perfis": [r.name for r in user.roles],
        "ativo": user.is_active,
    }
    return UserRead.model_validate(user)


@router.put("/{user_id}", response_model=UserRead, dependencies=[Depends(get_current_admin_user)])
def update_user(
    user_id: int,
    payload: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserRead:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    alteracoes: dict = {}

    if payload.email and payload.email != user.email:
        existing = db.scalar(select(User).where(User.email == payload.email))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User email already exists")
        alteracoes["email"] = {"de": user.email, "para": payload.email}
        user.email = payload.email

    if payload.name is not None and payload.name != user.name:
        alteracoes["nome"] = {"de": user.name, "para": payload.name}
        user.name = payload.name

    if payload.is_active is not None and payload.is_active != user.is_active:
        if user.id == current_user.id and payload.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate your own user",
            )
        alteracoes["ativo"] = {"de": user.is_active, "para": payload.is_active}
        user.is_active = payload.is_active

    if payload.password:
        alteracoes["senha"] = "alterada"
        user.password_hash = get_password_hash(payload.password)

    if payload.role_names is not None:
        perfis_antigos = sorted(r.name for r in user.roles)
        novos_roles = _resolve_roles(db, payload.role_names)
        perfis_novos = sorted(r.name for r in novos_roles)
        if perfis_antigos != perfis_novos:
            alteracoes["perfis"] = {"de": perfis_antigos, "para": perfis_novos}
        user.roles = novos_roles

    db.commit()
    db.refresh(user)

    request.state.audit_details = {
        "usuario": user.email,
        "alterações": alteracoes,
    }
    return UserRead.model_validate(user)


@router.put(
    "/{user_id}/permissions",
    response_model=UserRead,
    dependencies=[Depends(get_current_admin_user)],
)
def update_user_permissions(
    user_id: int,
    payload: UserPermissionsUpdate,
    request: Request,
    db: Session = Depends(get_db),
) -> UserRead:
    user = db.scalar(_query_users(db).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    perms_antigas = sorted(p.name for p in user.permissions)
    user.permissions = _resolve_permissions(db, payload.permission_names)
    perms_novas = sorted(p.name for p in user.permissions)
    db.commit()
    db.refresh(user)

    request.state.audit_details = {
        "usuario": user.email,
        "permissões": {"de": perms_antigas, "para": perms_novas},
    }
    return UserRead.model_validate(user)


@router.post(
    "/{user_id}/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_current_admin_user)],
)
def reset_user_password(
    user_id: int,
    payload: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> None:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = get_password_hash(payload.new_password)
    user.password_changed_at = datetime.now(timezone.utc)
    db.commit()
    AuthService(db).revoke_user_sessions(user_id)

    request.state.audit_details = {
        "usuario": user.email,
        "nome": user.name,
    }


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin_user)])
def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own user")

    request.state.audit_details = {
        "nome": user.name,
        "email": user.email,
        "perfis": [r.name for r in user.roles],
    }
    db.delete(user)
    db.commit()
