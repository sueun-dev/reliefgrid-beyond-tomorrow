"""Pydantic request/response schemas (API contract)."""

from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Need = Literal["Water", "Medical", "Cooling", "Power"]
TimeWindow = Literal[6, 12, 24]
TransportMode = Literal["bike", "van", "mixed"]


# Zones
class ZoneBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    need: Need = "Water"
    residents: int = Field(0, ge=0, le=50_000_000)
    vulnerable: int = Field(0, ge=0, le=100)
    severity: int = Field(0, ge=0, le=100)
    distance: float = Field(0, ge=0, le=20000)
    comms: int = Field(0, ge=0, le=100)
    x: float = Field(0.5, ge=0, le=1)
    y: float = Field(0.5, ge=0, le=1)


class ZoneCreate(ZoneBase):
    pass


class ZoneUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    need: Optional[Need] = None
    residents: Optional[int] = Field(None, ge=0, le=50_000_000)
    vulnerable: Optional[int] = Field(None, ge=0, le=100)
    severity: Optional[int] = Field(None, ge=0, le=100)
    distance: Optional[float] = Field(None, ge=0, le=20000)
    comms: Optional[int] = Field(None, ge=0, le=100)
    x: Optional[float] = Field(None, ge=0, le=1)
    y: Optional[float] = Field(None, ge=0, le=1)


class ZoneOut(ZoneBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    position: int
    # Real-world provenance (present when the zone was built from live data)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    population: Optional[int] = None
    severity_basis: Optional[str] = None
    data_source: Optional[str] = None


# Incidents
class IncidentBase(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    kind: str = Field("custom", max_length=32)
    time_window: TimeWindow = 12
    transport_mode: TransportMode = "van"
    water_kits: int = Field(0, ge=0, le=1_000_000)
    medical_kits: int = Field(0, ge=0, le=1_000_000)
    cooling_units: int = Field(0, ge=0, le=1_000_000)
    field_teams: int = Field(1, ge=1, le=5000)
    hub_place: Optional[str] = Field(None, max_length=160)
    hub_lat: Optional[float] = Field(None, ge=-90, le=90)
    hub_lon: Optional[float] = Field(None, ge=-180, le=180)


class IncidentCreate(IncidentBase):
    zones: List[ZoneCreate] = Field(default_factory=list)


class IncidentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=160)
    time_window: Optional[TimeWindow] = None
    transport_mode: Optional[TransportMode] = None
    water_kits: Optional[int] = Field(None, ge=0, le=1_000_000)
    medical_kits: Optional[int] = Field(None, ge=0, le=1_000_000)
    cooling_units: Optional[int] = Field(None, ge=0, le=1_000_000)
    field_teams: Optional[int] = Field(None, ge=1, le=5000)
    hub_place: Optional[str] = Field(None, max_length=160)
    hub_lat: Optional[float] = Field(None, ge=-90, le=90)
    hub_lon: Optional[float] = Field(None, ge=-180, le=180)


class IncidentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    kind: str
    time_window: int
    transport_mode: str
    created_at: datetime
    updated_at: datetime


class IncidentOut(IncidentSummary):
    water_kits: int
    medical_kits: int
    cooling_units: int
    field_teams: int
    hub_place: Optional[str] = None
    hub_lat: Optional[float] = None
    hub_lon: Optional[float] = None
    zones: List[ZoneOut] = Field(default_factory=list)


# Ranking / dispatch
class RankedZone(ZoneOut):
    score: int
    fit: int


class Metrics(BaseModel):
    impact: int
    coverage: int
    residual_risk: int


class TopMission(BaseModel):
    title: str
    detail: str


class RankingOut(BaseModel):
    incident_id: int
    incident_name: str
    ranked: List[RankedZone]
    metrics: Metrics
    top_mission: Optional[TopMission]
    action_plan: List[str]
    brief_text: str


class DispatchPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    incident_id: int
    top_zone_name: str
    top_need: str
    impact_score: int
    coverage: int
    residual_risk: int
    brief_text: str
    created_at: datetime


# Templates
class TemplateInfo(BaseModel):
    key: str
    label: str
    description: str


# Live real-world data (Open-Meteo)
class GeocodeCandidate(BaseModel):
    name: Optional[str] = None
    admin1: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    population: Optional[int] = None


class LiveZoneRequest(BaseModel):
    place: str = Field(min_length=1, max_length=120)
    need: Need = "Water"
    # Optional exact coordinates from a chosen geocode candidate (skips re-geocoding,
    # which removes place-name ambiguity like "Beaumont, TX" vs "Beaumont, France").
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    population: Optional[int] = Field(None, ge=0, le=50_000_000)
    admin1: Optional[str] = Field(None, max_length=120)


class LiveStatus(BaseModel):
    reachable: bool
    provider: str = "Open-Meteo"
    detail: str
