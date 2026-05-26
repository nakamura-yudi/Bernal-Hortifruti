from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin_user, get_db
from app.models.permission import Permission
from app.schemas.permission import PermissionRead

router = APIRouter(prefix="/permissions", tags=["Permissions"])


@router.get("", response_model=list[PermissionRead], dependencies=[Depends(get_current_admin_user)])
def list_permissions(db: Session = Depends(get_db)) -> list[PermissionRead]:
    permissions = db.scalars(select(Permission).order_by(Permission.name)).all()
    return [PermissionRead.model_validate(item) for item in permissions]
