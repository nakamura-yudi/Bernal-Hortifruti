from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_current_admin_user, get_db
from app.models.permission import Permission
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleRead, RoleUpdate

router = APIRouter(prefix="/roles", tags=["Roles"])


def _query_roles():
    return select(Role).options(selectinload(Role.permissions))


def _resolve_permissions(db: Session, permission_names: list[str]) -> list[Permission]:
    names = sorted({name.strip() for name in permission_names if name.strip()})
    if not names:
        return []

    permissions = db.scalars(select(Permission).where(Permission.name.in_(names)).order_by(Permission.name)).all()
    found = {permission.name for permission in permissions}
    missing = [name for name in names if name not in found]
    if missing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Permission not found: {missing[0]}")
    return permissions


@router.get("", response_model=list[RoleRead], dependencies=[Depends(get_current_admin_user)])
def list_roles(db: Session = Depends(get_db)) -> list[RoleRead]:
    roles = db.scalars(_query_roles().order_by(Role.name)).all()
    return [RoleRead.model_validate(item) for item in roles]


@router.post("", response_model=RoleRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_admin_user)])
def create_role(payload: RoleCreate, request: Request, db: Session = Depends(get_db)) -> RoleRead:
    role_name = payload.name.strip().upper()
    existing = db.scalar(select(Role).where(Role.name == role_name))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Role already exists")

    role = Role(name=role_name)
    role.permissions = _resolve_permissions(db, payload.permission_names)
    db.add(role)
    db.commit()
    db.refresh(role)
    role = db.scalar(_query_roles().where(Role.id == role.id))

    request.state.audit_details = {
        "perfil": role.name,
        "permissões": sorted(p.name for p in role.permissions),
    }
    return RoleRead.model_validate(role)


@router.put("/{role_id}", response_model=RoleRead, dependencies=[Depends(get_current_admin_user)])
def update_role(role_id: int, payload: RoleUpdate, request: Request, db: Session = Depends(get_db)) -> RoleRead:
    role = db.scalar(_query_roles().where(Role.id == role_id))
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    alteracoes: dict = {}

    if payload.name is not None:
        role_name = payload.name.strip().upper()
        if not role_name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role name is required")
        existing = db.scalar(select(Role).where(Role.name == role_name, Role.id != role_id))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Role already exists")
        if role_name != role.name:
            alteracoes["nome"] = {"de": role.name, "para": role_name}
        role.name = role_name

    if payload.permission_names is not None:
        perms_antigas = sorted(p.name for p in role.permissions)
        role.permissions = _resolve_permissions(db, payload.permission_names)
        perms_novas = sorted(p.name for p in role.permissions)
        if perms_antigas != perms_novas:
            alteracoes["permissões"] = {"de": perms_antigas, "para": perms_novas}

    db.commit()
    db.refresh(role)
    role = db.scalar(_query_roles().where(Role.id == role.id))

    request.state.audit_details = {
        "perfil": role.name,
        "alterações": alteracoes,
    }
    return RoleRead.model_validate(role)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin_user)])
def delete_role(role_id: int, request: Request, db: Session = Depends(get_db)) -> None:
    role = db.scalar(_query_roles().where(Role.id == role_id))
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    request.state.audit_details = {
        "perfil": role.name,
        "permissões": sorted(p.name for p in role.permissions),
    }
    db.delete(role)
    db.commit()
