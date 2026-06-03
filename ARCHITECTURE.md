# ReliefGrid — Architecture

A single FastAPI process serves both the REST API (`/api/*`) and the single-page
frontend (`/`). State lives in SQLite via SQLAlchemy. Scoring is a pure function.

## Request lifecycle

```
slider/edit ─▶ PATCH /api/zones/{id}          (frontend/js/api.js)
            ─▶ SQLAlchemy UPDATE              (backend/app/routers/zones.py)
GET /api/incidents/{id}/ranking
            ─▶ scoring.compute(incident)       (backend/app/scoring.py, pure)
            ─▶ RankingOut JSON                 (backend/app/schemas.py)
            ─▶ render queue/map/metrics        (frontend/js/app.js, map.js)
```

The frontend holds almost no business logic: it sends edits and renders whatever the
server computes, so the displayed ranking is always the server's ranking.

## Data model (`backend/app/models.py`)

```
Incident (1) ───< Zone (N)
   │  name, kind, time_window, transport_mode,
   │  water_kits, medical_kits, cooling_units, field_teams
   └──< DispatchPlan (N)   immutable committed snapshots (audit trail)

Zone     name, need, residents, vulnerable, severity, distance, comms, x, y
DispatchPlan  top_zone_name, top_need, impact_score, coverage,
              residual_risk, brief_text, payload(JSON), created_at
```

Deletes cascade (incident → zones + dispatch plans). The DB file is created and
seeded with the heatwave + flood scenarios on first boot.

## The scoring rule (`backend/app/scoring.py`)

Every term is explicit and inspectable — this is the product's core claim.

For each zone:

```
exposure     = severity·0.44 + vulnerable·0.28 + min(100, residents/7)·0.18
signal_risk  = (100 − comms)·0.18
resource_fit = coverage of the zone's dominant need by the resource pool, capped 100
             = Water   : water_kits   / max(1, residents/8)  · 100
               Medical : medical_kits / max(1, vulnerable/4) · 100
               Cooling : cooling_units/ max(1, vulnerable/10)· 100
               Power   : (medical+water)/max(1, residents/10)· 100
travel       = distance · {bike 1.2, mixed 0.85, van 0.65}
time_pressure= 1.12 if window ≤ 6h, 0.92 if ≥ 24h, else 1.0

score = max(0, round( (exposure + signal_risk + resource_fit·0.20 − travel) · time_pressure ))
```

Incident-level metrics:

```
coverage      = round(mean(resource_fit over zones))
residual_risk = max(0, round(100 − coverage·0.45 − field_teams·4))
impact        = top zone's score
```

The action plan and brief text are generated from the ranked result (top + runner-up,
field-team split, comms-runner trigger, supply-shortfall fallback).

These exact numbers are pinned in `qa.py` (e.g. heatwave top = 93 @ 12h, 104 @ 6h;
flood top = 99), so any change to the rule is caught immediately.

## Why these choices

- **SQLite + SQLAlchemy:** zero-setup, file-backed, real relational integrity and
  cascades; trivially swappable for Postgres by changing one URL.
- **Pure scoring module:** deterministic, unit-testable, reusable by API and tests
  without a database or server.
- **One process serving API + SPA:** a single `./run.sh` and one port for the whole
  demo; the SPA is a thin, documented client (drive the same API from `/docs`).
- **Vanilla ES modules:** no build step, no toolchain, instant to run anywhere Python
  is available.
