"""Live real-world data endpoints (Open-Meteo).

These turn a real place name into a real response zone: real coordinates and
population from geocoding, a severity derived from real current weather, and a
real great-circle distance from the incident's relief hub. Nothing here is
synthetic.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import datasources as ds
from .. import models, schemas
from ..database import get_db
from .incidents import get_incident_or_404

router = APIRouter(prefix="/api/live", tags=["live data"])

# Mounted separately because it nests under /api/incidents
incident_router = APIRouter(prefix="/api", tags=["live data"])


def _project_xy(lat: float, lon: float, hub_lat: float, hub_lon: float) -> tuple[float, float]:
    """Place a real coordinate on the 0-1 map canvas, relative to the hub."""
    scale = 1.4
    x = 0.5 + (lon - hub_lon) * scale
    y = 0.5 - (lat - hub_lat) * scale
    clamp = lambda v: max(0.06, min(0.94, v))  # noqa: E731
    return round(clamp(x), 4), round(clamp(y), 4)


@router.get("/status", response_model=schemas.LiveStatus)
def live_status() -> schemas.LiveStatus:
    """Quick reachability check for the live data provider."""
    try:
        ds.geocode("London", count=1)
        return schemas.LiveStatus(reachable=True, detail="Open-Meteo geocoding + forecast reachable")
    except ds.LiveDataError as exc:
        return schemas.LiveStatus(reachable=False, detail=str(exc))


@router.get("/geocode", response_model=List[schemas.GeocodeCandidate])
def geocode(q: str = Query(min_length=1, max_length=120)) -> list:
    """Real place-name search → coordinates + population candidates."""
    try:
        return ds.geocode(q, count=6)
    except ds.LiveDataError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@incident_router.post(
    "/incidents/{incident_id}/zones/from-place",
    response_model=schemas.ZoneOut,
    status_code=status.HTTP_201_CREATED,
    tags=["live data"],
)
def add_zone_from_place(
    incident_id: int, payload: schemas.LiveZoneRequest, db: Session = Depends(get_db)
) -> models.Zone:
    """Build a real response zone from a real place name + live weather."""
    incident = get_incident_or_404(incident_id, db)

    # Prefer exact coordinates from a chosen candidate; otherwise geocode the name.
    if payload.latitude is not None and payload.longitude is not None:
        place = {
            "name": payload.place,
            "admin1": payload.admin1,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "population": payload.population,
        }
    else:
        try:
            place = ds.geocode_one(payload.place)
        except ds.LiveDataError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    if place.get("latitude") is None or place.get("longitude") is None:
        raise HTTPException(status_code=502, detail="Geocoding returned no coordinates")

    # The first real location establishes the relief hub if none is set yet.
    if incident.hub_lat is None or incident.hub_lon is None:
        incident.hub_lat = place["latitude"]
        incident.hub_lon = place["longitude"]
        incident.hub_place = place.get("name")

    try:
        signals = ds.build_zone_signals(incident.kind, place, incident.hub_lat, incident.hub_lon)
    except ds.LiveDataError:
        # Geocoding worked but live weather is momentarily unavailable (e.g. the
        # provider rate-limits this host). Add the zone anyway with its real
        # coordinates, population and distance; the operator fills in severity.
        label0 = ", ".join([p for p in [place.get("name"), place.get("admin1")] if p]) or payload.place
        pop = place.get("population")
        signals = {
            "latitude": place["latitude"],
            "longitude": place["longitude"],
            "population": int(pop) if pop else None,
            "residents": int(pop) if pop else 0,
            "severity": 0,
            "severity_basis": "live weather unavailable",
            "data_source": f"Open-Meteo geocoding · {label0} · live weather unavailable",
        }

    x, y = _project_xy(place["latitude"], place["longitude"], incident.hub_lat, incident.hub_lon)
    label = ", ".join([p for p in [place.get("name"), place.get("admin1")] if p]) or payload.place
    next_position = db.scalar(
        select(func.coalesce(func.max(models.Zone.position), -1) + 1).where(models.Zone.incident_id == incident.id)
    )

    zone = models.Zone(
        incident_id=incident.id,
        position=next_position,
        name=label[:120],
        need=payload.need,
        residents=signals["residents"],
        vulnerable=0,   # operator-reported - not invented
        severity=signals["severity"],
        distance=signals["distance"],
        comms=0,        # operator-reported - not invented
        x=x,
        y=y,
        latitude=signals["latitude"],
        longitude=signals["longitude"],
        population=signals["population"],
        severity_basis=signals["severity_basis"],
        data_source=signals["data_source"],
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone
