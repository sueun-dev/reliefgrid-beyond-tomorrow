"""Scenario templates and first-run seeding.

Each template is a relief hub plus nearby places. The seed data (real
coordinates, population, weather-derived severity and distance) was fetched from
Open-Meteo and is cached in seed_data.json, so the demo populates instantly and
doesn't depend on the geocoding API being reachable at boot. Live geocoding is
still used for the "Add location" feature. vulnerable% and comms% start at 0 for
the operator to fill in.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict

from sqlalchemy.orm import Session

from . import datasources as ds
from . import models

logger = logging.getLogger("reliefgrid.seed")

SNAPSHOT_PATH = Path(__file__).resolve().parent / "seed_data.json"

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


def build_incident_from_snapshot(key: str) -> models.Incident:
    """Build an incident from the cached real-data snapshot (no network)."""
    data = json.loads(SNAPSHOT_PATH.read_text())[key]
    incident = models.Incident(**data["incident"])
    for zone in data["zones"]:
        incident.zones.append(models.Zone(**zone))
    return incident


def seed_if_empty(db: Session) -> None:
    """Ensure the demo incidents (with zones) exist.

    Seeds from the cached real-data snapshot so a fresh or wiped database always
    comes up populated. Re-seeds when zones are missing, which also repairs an
    instance whose ephemeral disk was reset.
    """
    if db.query(models.Zone).count() > 0:
        return
    # Clear any zone-less incidents left by an earlier failed boot, then reseed.
    db.query(models.Incident).delete()
    db.commit()
    for key in ("heatwave", "flood"):
        db.add(build_incident_from_snapshot(key))
        db.commit()
