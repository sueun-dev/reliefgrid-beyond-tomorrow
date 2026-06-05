"""SQLAlchemy ORM models for ReliefGrid.

The schema captures the full domain:

* ``Incident``      - a crisis event with its operating constraints and resource pool.
* ``Zone``          - a response area within an incident, with live signal inputs.
* ``DispatchPlan``  - an immutable snapshot of a computed dispatch brief, so teams
                      keep an auditable history of every decision they committed to.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), default="custom")  # heatwave | flood | custom

    # Operating constraints
    time_window: Mapped[int] = mapped_column(Integer, default=12)  # hours: 6 | 12 | 24
    transport_mode: Mapped[str] = mapped_column(String(16), default="van")  # bike | van | mixed

    # Resource pool
    water_kits: Mapped[int] = mapped_column(Integer, default=0)
    medical_kits: Mapped[int] = mapped_column(Integer, default=0)
    cooling_units: Mapped[int] = mapped_column(Integer, default=0)
    field_teams: Mapped[int] = mapped_column(Integer, default=1)

    # Relief hub - a real geocoded origin point for travel-distance math
    hub_place: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    hub_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hub_lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, server_default=func.now()
    )

    zones: Mapped[List["Zone"]] = relationship(
        back_populates="incident",
        cascade="all, delete-orphan",
        order_by="Zone.position",
    )
    dispatch_plans: Mapped[List["DispatchPlan"]] = relationship(
        back_populates="incident",
        cascade="all, delete-orphan",
        order_by="DispatchPlan.created_at.desc()",
    )


class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[int] = mapped_column(primary_key=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    need: Mapped[str] = mapped_column(String(24), default="Water")  # Water | Medical | Cooling | Power

    # Live signal inputs (0-100 scales unless noted)
    residents: Mapped[int] = mapped_column(Integer, default=0)
    vulnerable: Mapped[int] = mapped_column(Integer, default=0)
    severity: Mapped[int] = mapped_column(Integer, default=0)
    distance: Mapped[float] = mapped_column(Float, default=0.0)  # km from relief hub
    comms: Mapped[int] = mapped_column(Integer, default=0)  # % reliability

    # Normalized map coordinates (0-1)
    x: Mapped[float] = mapped_column(Float, default=0.5)
    y: Mapped[float] = mapped_column(Float, default=0.5)

    # Real-world provenance (populated when a zone is built from live data)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    population: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    severity_basis: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    data_source: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    incident: Mapped["Incident"] = relationship(back_populates="zones")


class DispatchPlan(Base):
    __tablename__ = "dispatch_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), index=True)

    top_zone_name: Mapped[str] = mapped_column(String(120))
    top_need: Mapped[str] = mapped_column(String(24))
    impact_score: Mapped[int] = mapped_column(Integer)
    coverage: Mapped[int] = mapped_column(Integer)
    residual_risk: Mapped[int] = mapped_column(Integer)

    brief_text: Mapped[str] = mapped_column(Text)
    # JSON-encoded ranked snapshot + action plan, stored as text for SQLite portability.
    payload: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, server_default=func.now())

    incident: Mapped["Incident"] = relationship(back_populates="dispatch_plans")
