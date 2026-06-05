"""Scenario templates and first-run seeding.

Each template is a relief hub plus nearby places. On seed we geocode each place
and pull live weather to set population, severity and distance; vulnerable% and
comms% start at 0 for the operator. If the data provider is down, the incident
is created without zones rather than with made-up values.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from sqlalchemy.orm import Session

from . import datasources as ds
from . import models

logger = logging.getLogger("reliefgrid.seed")

TEMPLATES: Dict[str, Dict[str, Any]] = {
    "heatwave": {
        "label": "Heatwave + grid stress",
        "description": "Real-time heat danger across a hot metro, scored from live apparent temperature.",
        "incident": {
            "name": "Metro heatwave and grid stress",
            "kind": "heatwave",
            "time_window": 12,
            "transport_mode": "van",
            "water_kits": 14000,
            "medical_kits": 5000,
            "cooling_units": 2500,
            "field_teams": 45,
        },
        "hub": "Phoenix",
        "zones": [
            {"place": "Mesa", "need": "Cooling"},
            {"place": "Tempe", "need": "Water"},
            {"place": "Scottsdale", "need": "Medical"},
            {"place": "Chandler", "need": "Cooling"},
        ],
    },
    "flood": {
        "label": "Flood + blocked roads",
        "description": "Real-time flood pressure along the Gulf coast, scored from live precipitation.",
        "incident": {
            "name": "Gulf-coast flood and blocked roads",
            "kind": "flood",
            "time_window": 6,
            "transport_mode": "mixed",
            "water_kits": 12000,
            "medical_kits": 6000,
            "cooling_units": 800,
            "field_teams": 50,
        },
        "hub": "Houston",
        "zones": [
            {"place": "Galveston", "need": "Medical"},
            {"place": "Baytown", "need": "Water"},
            {"place": "Texas City", "need": "Power"},
            {"place": "League City", "need": "Medical"},
        ],
    },
}


def build_incident_from_template(key: str) -> models.Incident:
    """Construct (but do not persist) an Incident graph from REAL live data.

    Raises ``LiveDataError`` only if the relief hub itself cannot be geocoded.
    Individual zones that fail to resolve are skipped rather than faked.
    """
    template = TEMPLATES[key]
    hub = ds.geocode_one(template["hub"])  # raises if provider unreachable

    incident = models.Incident(
        **template["incident"],
        hub_place=hub.get("name"),
        hub_lat=hub["latitude"],
        hub_lon=hub["longitude"],
    )

    scale = 1.4
    for position, spec in enumerate(template["zones"]):
        try:
            place = ds.geocode_near(spec["place"], hub["latitude"], hub["longitude"])
            signals = ds.build_zone_signals(template["incident"]["kind"], place, hub["latitude"], hub["longitude"])
        except ds.LiveDataError as exc:
            logger.warning("Skipping zone %s: %s", spec["place"], exc)
            continue
        x = max(0.06, min(0.94, 0.5 + (place["longitude"] - hub["longitude"]) * scale))
        y = max(0.06, min(0.94, 0.5 - (place["latitude"] - hub["latitude"]) * scale))
        label = ", ".join([p for p in [place.get("name"), place.get("admin1")] if p]) or spec["place"]
        incident.zones.append(models.Zone(
            position=position,
            name=label[:120],
            need=spec["need"],
            residents=signals["residents"],
            vulnerable=0,
            severity=signals["severity"],
            distance=signals["distance"],
            comms=0,
            x=round(x, 4),
            y=round(y, 4),
            latitude=signals["latitude"],
            longitude=signals["longitude"],
            population=signals["population"],
            severity_basis=signals["severity_basis"],
            data_source=signals["data_source"],
        ))
    return incident


def seed_if_empty(db: Session) -> None:
    """Populate a fresh database with real-data demo incidents."""
    if db.query(models.Incident).count() > 0:
        return
    for key in ("heatwave", "flood"):
        try:
            db.add(build_incident_from_template(key))
            db.commit()
        except ds.LiveDataError as exc:
            db.rollback()
            logger.warning("Live seed for '%s' unavailable (%s); creating empty incident.", key, exc)
            tpl = TEMPLATES[key]
            db.add(models.Incident(**tpl["incident"]))
            db.commit()
