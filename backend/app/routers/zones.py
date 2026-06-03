"""Zone editing endpoints (nested under an incident)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from .incidents import get_incident_or_404

router = APIRouter(prefix="/api", tags=["zones"])


def get_zone_or_404(zone_id: int, db: Session) -> models.Zone:
    zone = db.get(models.Zone, zone_id)
    if zone is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
    return zone


@router.post(
    "/incidents/{incident_id}/zones",
    response_model=schemas.ZoneOut,
    status_code=status.HTTP_201_CREATED,
)
def add_zone(incident_id: int, payload: schemas.ZoneCreate, db: Session = Depends(get_db)) -> models.Zone:
    incident = get_incident_or_404(incident_id, db)
    next_position = db.scalar(
        select(func.coalesce(func.max(models.Zone.position), -1) + 1).where(models.Zone.incident_id == incident.id)
    )
    zone = models.Zone(incident_id=incident.id, position=next_position, **payload.model_dump())
    db.add(zone)
    incident.updated_at = func.now()
    db.commit()
    db.refresh(zone)
    return zone


@router.patch("/zones/{zone_id}", response_model=schemas.ZoneOut)
def update_zone(zone_id: int, payload: schemas.ZoneUpdate, db: Session = Depends(get_db)) -> models.Zone:
    zone = get_zone_or_404(zone_id, db)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(zone, key, value)
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/zones/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(zone_id: int, db: Session = Depends(get_db)) -> Response:
    zone = get_zone_or_404(zone_id, db)
    db.delete(zone)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
