"""Incident CRUD and template instantiation endpoints."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import datasources as ds
from .. import models, schemas
from ..database import get_db
from ..seed import TEMPLATES, build_incident_from_template

router = APIRouter(prefix="/api", tags=["incidents"])


def get_incident_or_404(incident_id: int, db: Session) -> models.Incident:
    incident = db.get(models.Incident, incident_id)
    if incident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return incident


@router.get("/templates", response_model=List[schemas.TemplateInfo])
def list_templates() -> List[schemas.TemplateInfo]:
    return [
        schemas.TemplateInfo(key=key, label=tpl["label"], description=tpl["description"])
        for key, tpl in TEMPLATES.items()
    ]


@router.get("/incidents", response_model=List[schemas.IncidentSummary])
def list_incidents(db: Session = Depends(get_db)) -> List[models.Incident]:
    return list(db.scalars(select(models.Incident).order_by(models.Incident.updated_at.desc())))


@router.post("/incidents", response_model=schemas.IncidentOut, status_code=status.HTTP_201_CREATED)
def create_incident(payload: schemas.IncidentCreate, db: Session = Depends(get_db)) -> models.Incident:
    data = payload.model_dump(exclude={"zones"})
    incident = models.Incident(**data)
    for position, zone in enumerate(payload.zones):
        incident.zones.append(models.Zone(position=position, **zone.model_dump()))
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.post(
    "/incidents/from-template/{template_key}",
    response_model=schemas.IncidentOut,
    status_code=status.HTTP_201_CREATED,
)
def create_from_template(template_key: str, db: Session = Depends(get_db)) -> models.Incident:
    if template_key not in TEMPLATES:
        raise HTTPException(status_code=404, detail=f"Unknown template '{template_key}'")
    try:
        incident = build_incident_from_template(template_key)
    except ds.LiveDataError as exc:
        raise HTTPException(status_code=502, detail=f"Live data provider unavailable: {exc}") from exc
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/incidents/{incident_id}", response_model=schemas.IncidentOut)
def get_incident(incident_id: int, db: Session = Depends(get_db)) -> models.Incident:
    return get_incident_or_404(incident_id, db)


@router.patch("/incidents/{incident_id}", response_model=schemas.IncidentOut)
def update_incident(
    incident_id: int, payload: schemas.IncidentUpdate, db: Session = Depends(get_db)
) -> models.Incident:
    incident = get_incident_or_404(incident_id, db)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(incident, key, value)
    db.commit()
    db.refresh(incident)
    return incident


@router.delete("/incidents/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(incident_id: int, db: Session = Depends(get_db)) -> Response:
    incident = get_incident_or_404(incident_id, db)
    db.delete(incident)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
