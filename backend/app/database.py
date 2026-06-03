"""Database engine, session factory, and declarative base.

Uses SQLite for a zero-setup, file-backed relational store. The database file
lives next to the backend package so a single ``python -m backend.app.main``
run is fully self-contained.
"""

from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Resolve an absolute path so the DB location is stable no matter the CWD.
BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "reliefgrid.db"

DATABASE_URL = os.environ.get("RELIEFGRID_DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

# check_same_thread is required for SQLite when used by FastAPI's threadpool.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def get_db():
    """FastAPI dependency that yields a scoped session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
