from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permissions
from app.models.caminhao import Caminhao
from app.schemas.caminhao import CaminhaoCreate, CaminhaoRead

router = APIRouter(prefix="/caminhoes", tags=["Caminhoes"])


@router.get("", response_model=list[CaminhaoRead])
def list_caminhoes(
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("vehicle:view")),
) -> list[CaminhaoRead]:
    caminhoes = db.scalars(select(Caminhao).order_by(Caminhao.plate)).all()
    return [CaminhaoRead.model_validate(item) for item in caminhoes]


@router.post("", response_model=CaminhaoRead, status_code=status.HTTP_201_CREATED)
def create_caminhao(
    payload: CaminhaoCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("vehicle:edit")),
) -> CaminhaoRead:
    existing = db.scalar(select(Caminhao).where(Caminhao.plate == payload.plate))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Truck plate already exists")
    caminhao = Caminhao(plate=payload.plate.upper(), description=payload.description)
    db.add(caminhao)
    db.commit()
    db.refresh(caminhao)
    return CaminhaoRead.model_validate(caminhao)
