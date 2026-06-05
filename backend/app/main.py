"""ReliefGrid FastAPI application.

Single self-contained service that exposes the REST API under ``/api`` and serves
the single-page frontend from ``/``. Interactive API docs live at ``/docs``.

Run from the project root:

    uvicorn backend.app.main:app --reload --port 8031

or simply:

    python -m backend.app.main
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select

from . import models  # noqa: F401  (ensure models are imported before create_all)
from .database import Base, SessionLocal, engine
from .routers import dispatch, incidents, live, zones
from .seed import seed_if_empty

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create the schema and seed demo data on first boot.
    Base.metadata.create_all(bind=engine)
    # RELIEFGRID_SKIP_SEED lets the offline test gate boot without live data calls.
    if not os.environ.get("RELIEFGRID_SKIP_SEED"):
        with SessionLocal() as db:
            seed_if_empty(db)
    yield


app = FastAPI(
    title="ReliefGrid API",
    version="2.0.0",
    description=(
        "Prioritize community emergency response when supplies, staffing, transport, "
        "and communications are limited."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents.router)
app.include_router(zones.router)
app.include_router(dispatch.router)
app.include_router(live.router)
app.include_router(live.incident_router)


@app.get("/api/health", tags=["meta"])
def health() -> dict:
    """Liveness probe plus a quick database census for the UI status bar."""
    with SessionLocal() as db:
        incidents_total = db.scalar(select(func.count()).select_from(models.Incident)) or 0
        zones_total = db.scalar(select(func.count()).select_from(models.Zone)) or 0
        plans_total = db.scalar(select(func.count()).select_from(models.DispatchPlan)) or 0
    return {
        "status": "ok",
        "database": "connected",
        "seeded": incidents_total > 0,
        "incidents": incidents_total,
        "zones": zones_total,
        "dispatch_plans": plans_total,
    }


# Serve the single-page frontend last so API routes take precedence.
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


def main() -> None:
    import uvicorn

    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8031, reload=False)


if __name__ == "__main__":
    main()
