# ReliefGrid

**Prioritize community response before a local emergency becomes a wider failure.**

ReliefGrid is a Beyond Tomorrow Summit submission for local responders, student
organizers, and community teams who must decide *where limited supplies should go
first* during a fast-moving emergency.

It turns **real-world signals** into a **dispatch brief**: the top zone, why it is
first, which supplies to send, what to do in the first operating hour, and the
fallback to use if the plan slips — backed by a real REST API, a persistent
database, and live data from real places, not just a single-screen toy.

Every response zone is a **real place**. Its population, heat/flood severity, and
travel distance are pulled live from the public [Open-Meteo](https://open-meteo.com/)
geocoding + weather APIs — no fabricated numbers. The only operator-entered signals
are the two with no public real-time feed: % vulnerable residents and % working comms.

```
┌──────────────┐  REST/JSON  ┌───────────────┐  SQLAlchemy  ┌────────────┐
│  SPA frontend │ ──────────▶ │ FastAPI server │ ───────────▶ │  SQLite DB │
│ (vanilla ESM) │ ◀────────── │  scoring core  │ ◀─────────── │ incidents… │
└──────────────┘   ranking    └───────┬───────┘   ORM models  └────────────┘
                                       │ httpx
                                       ▼
                            ┌─────────────────────┐
                            │  Open-Meteo (live)   │
                            │ geocoding + weather  │
                            └─────────────────────┘
```

---

## What it does

1. **Model the incident** — name, operating window (6/12/24h), transport mode, and a
   resource pool (water kits, medical kits, cooling units, field teams).
2. **Add real locations** — search any place; ReliefGrid geocodes it (real
   coordinates + population) and pulls live weather to derive severity and a real
   great-circle distance from the relief hub. You add only the two field-reported
   signals — % vulnerable residents and % working comms.
3. **Score transparently** — the server ranks every zone on a *fully inspectable*
   rule (no black box) and recomputes on every edit.
4. **Read the brief** — top mission, priority queue, response map, three headline
   metrics (impact / coverage / residual risk), and a first-hour action plan.
5. **Commit & keep an audit trail** — save a dispatch snapshot to the database,
   copy the brief, or export it as a shareable PNG.

Two real scenarios — a **metro heatwave** (Phoenix-area cities) and a **Gulf-coast
flood** (Houston-area cities) — are seeded from live data on first boot, so the app
always opens on real places with real current conditions.

## Why it's different

- **Real data, not dummy data.** Population, severity, and distance come from live
  Open-Meteo geocoding + weather for real places. Severity is *derived* from real
  measurements (apparent temperature for heat, precipitation for flood) with a
  disclosed formula. Fields with no public feed aren't invented — the operator
  reports them.
- **Real full stack.** A FastAPI backend computes the scoring server-side and a
  SQLite database persists incidents, zones, and every committed dispatch. The UI
  is a thin client over a documented API — open `/docs` to drive it directly.
- **Transparent, editable scoring.** Every term (severity, vulnerability, exposure,
  comms risk, resource fit, travel penalty, time pressure) is visible and tunable.
- **Operational output.** The result is a dispatch brief with a first-hour plan and
  a fallback — not generic analytics.
- **Accountless.** No signup and no tracking; your work persists in a local database.

## Data provenance

| Signal | Source | Class |
|--------|--------|-------|
| Coordinates, population | Open-Meteo **geocoding** API | 🟢 live measured |
| Travel distance | **haversine** between real coordinates | 🟢 computed |
| Heat / flood severity | mapped from real **apparent temperature / precipitation** via a disclosed formula | 🟠 derived from live |
| % vulnerable residents, % comms | operator field report (no public feed) | 🔵 you report |
| Resource pool, need, window, transport | operational settings (no public feed) | 🔵 you set |

Each live zone stores its exact provenance string (e.g. `Open-Meteo · Mesa, Arizona ·
apparent temp 40.8 °C · observed 2026-06-03T09:45`) and the UI labels every field as
**live**, **derived**, or **you report/set** — nothing measured is faked, and nothing
operator-entered is dressed up as measured. The severity *inputs* are real; the 0–100
mapping and the scoring weights are transparent modelling choices, visible in `scoring.py`
and `datasources.py`.

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | HTML, modern CSS, vanilla **ES modules**, Canvas API |
| Backend   | **FastAPI** (Python), Uvicorn, auto-generated OpenAPI docs |
| Data      | **SQLite** via **SQLAlchemy 2.0** ORM |
| Live data | **Open-Meteo** geocoding + weather APIs via **httpx** (no key) |
| Scoring   | Pure, unit-tested Python scoring engine |

## Run it (one command)

```bash
./run.sh
```

This creates a virtualenv, installs dependencies, and serves everything on one port:

- App: <http://127.0.0.1:8031/>
- Interactive API docs (Swagger): <http://127.0.0.1:8031/docs>
- Health probe: <http://127.0.0.1:8031/api/health>

<details>
<summary>Manual steps (no script)</summary>

```bash
python3 -m venv .venv
./.venv/bin/python -m pip install -r requirements.txt
./.venv/bin/python -m uvicorn backend.app.main:app --port 8031
# or simply: ./.venv/bin/python serve.py
```
</details>

The database (`backend/reliefgrid.db`) is created and seeded automatically on first
boot; it is gitignored, so a fresh clone always starts clean.

## Quality gate

```bash
./.venv/bin/python qa.py
```

Runs 29 checks in-process: scoring-engine fixtures, full incident/zone CRUD, live
ranking, dispatch persistence, validation/404 handling, that the frontend + OpenAPI
docs are served, and — when online — a real geocode + weather-backed zone build. The
core suite needs no network; live checks self-skip when offline. Expected: **29 passed**.

## API surface

| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/api/health` | liveness + DB census |
| GET    | `/api/templates` | scenario templates |
| GET / POST | `/api/incidents` | list / create incidents |
| POST   | `/api/incidents/from-template/{key}` | seed an incident from a scenario |
| GET / PATCH / DELETE | `/api/incidents/{id}` | read / edit / remove an incident |
| POST   | `/api/incidents/{id}/zones` | add a response zone |
| POST   | `/api/incidents/{id}/zones/from-place` | **add a real zone from live data** |
| PATCH / DELETE | `/api/zones/{id}` | edit / remove a zone |
| GET    | `/api/incidents/{id}/ranking` | live computed dispatch brief |
| POST   | `/api/incidents/{id}/dispatch` | commit a dispatch snapshot |
| GET    | `/api/incidents/{id}/dispatch-plans` | committed-dispatch history |
| GET    | `/api/live/geocode?q=` | **real place search (Open-Meteo)** |
| GET    | `/api/live/status` | live-data provider reachability |

Full request/response schemas are browsable and runnable at `/docs`.

## Project layout

```
backend/
  app/
    main.py          FastAPI app: lifespan, CORS, routers, static mount
    database.py      SQLAlchemy engine/session, declarative base
    models.py        ORM models: Incident, Zone (+ live provenance), DispatchPlan
    schemas.py       Pydantic request/response contracts
    scoring.py       pure priority-scoring engine
    datasources.py   Open-Meteo geocoding + weather + severity derivation
    seed.py          real-data scenario templates + first-run seeding
    routers/         incidents / zones / dispatch / live endpoints
frontend/
  index.html         app shell
  css/styles.css     mission-control design system
  js/                api · state/render (app) · map · receipt · toast (ES modules)
serve.py             convenience entry point (python serve.py)
run.sh               one-command venv + install + run
qa.py                in-process end-to-end QA gate
legacy/              the original static prototype, preserved for reference
```

## Submission prep

- Devpost paste-ready fields: `DEVPOST_FIELDS.md`
- Devpost submission draft: `submission.md`
- Judge-facing rubric brief: `JUDGE_BRIEF.md`
- Final submit runbook: `SUBMIT_RUNBOOK.md`
- 60–75s demo script: `demo-script.md`
- Pitch deck: `reliefgrid-pitch-deck.pptx`
