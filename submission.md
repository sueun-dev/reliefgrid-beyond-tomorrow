# Devpost Submission Draft

## Project Name

ReliefGrid

## Tagline

Prioritize response before the crisis spreads.

## Hackathon Fit

ReliefGrid is a social impact, smart automation, and healthcare / climate
resilience project for the Beyond Tomorrow Summit. The challenge asks for
future-facing technology with real-world applicability, scalability, usability,
technical execution, and a clear problem-solving approach. ReliefGrid answers that
with a working full-stack tool that helps local teams prioritize emergency response
when supplies, staffing, transport, and communications are constrained.

## Project Description

ReliefGrid helps local teams decide where limited emergency supplies should go
first. It turns noisy crisis signals into a dispatch brief: the top response zone,
why it is first, which supplies to send, what to do in the first operating hour, and
what fallback to use if the plan slips.

It is built as a real full-stack application - a FastAPI backend computes the
priority scoring server-side, a SQLite database persists incidents, response zones,
and every committed dispatch, and a single-page frontend drives it all through a
documented REST API. The same API is browsable and runnable at `/docs`.

Crucially, the inputs are **real, not fabricated**. Every response zone is a real
place: its population, heat/flood severity, and travel distance are pulled live from
the public Open-Meteo geocoding + weather APIs. The only operator-entered signals are
the two with no public real-time feed (% vulnerable residents, % working comms).

The prototype is built for heatwaves, floods, clinic outages, and community resource
shortages where responders need a clear decision faster than a full command center
can be assembled.

## Problem

In fast-moving local emergencies, teams often have scarce supplies, incomplete
communications, and several neighborhoods that all seem urgent. Without a shared
priority model, the first response can go to the loudest report instead of the
highest-risk zone.

## Solution

ReliefGrid scores each response zone using severity, vulnerable residents, population
exposure, comms reliability, resource fit, and travel friction, then scales by how
tight the operating window is. It shows the priority route on a response map and
produces a dispatch brief that can be committed to a database, copied, or exported as
a PNG. Because the scoring runs on the server and the data is persisted, a team can
revisit prior incidents and audit every dispatch decision they committed to.

## Key Features

- **Real places, real data:** search any location and ReliefGrid fetches live
  population, weather-derived severity, and great-circle distance from Open-Meteo.
- Real metro-heatwave and Gulf-coast-flood scenarios, seeded from live data on boot.
- Editable incident setup and resource pool; per-zone operator signals (vulnerable %,
  comms %) - measured fields stay read-only with visible provenance.
- Transparent, server-side priority scoring that recomputes on every edit.
- Response map with ranked routes from the relief hub.
- Three headline metrics: impact, coverage, and residual risk.
- Dispatch brief with a first-hour action plan and an explicit fallback.
- Commit dispatches to the database and keep a timestamped history (audit trail).
- Copy the brief or export it as a shareable PNG receipt.
- Interactive, self-documenting REST API at `/docs`.

## How It Works

The frontend is a thin client. Every edit (incident parameters, resource counts, or a
zone slider) is sent to the FastAPI backend, which recomputes the ranking and returns
the updated brief. Each response zone is scored with a transparent rule that rewards
severity, vulnerability, exposure, comms risk, and resource fit while penalizing
travel friction, then multiplies by a time-pressure factor for tight windows. The top
zone becomes the dispatch brief: what to send, why it wins, the first move, and the
if-then fallback. Incidents, zones, and committed dispatches are stored in SQLite via
SQLAlchemy, so work survives a page reload without any account.

## Why It Fits Beyond Tomorrow Summit

- **Real-world applicability:** a concrete decision aid for community emergency teams.
- **Technical execution:** a genuine full stack - REST API, ORM-backed database,
  live third-party data integration (Open-Meteo), a unit-tested scoring engine, and
  an automated 29-check QA gate.
- **Usability:** opens on a real scenario, edits are immediate, output is an
  operational brief a non-expert can act on.
- **Scalability:** the API/DB design extends cleanly to multiple incidents, teams, and
  a hosted deployment.

## Built With

- Python
- FastAPI
- Uvicorn
- SQLAlchemy (SQLite)
- Pydantic
- Open-Meteo geocoding + weather APIs (live real-world data, via httpx)
- HTML, CSS, JavaScript (ES modules)
- Canvas API

## Category Positioning

Primary: Social Impact Solutions, Smart Automation, Healthcare Technology,
Sustainability / Climate Innovation.

Secondary: Data & Analytics Platforms, Productivity Solutions.

## Setup Instructions

1. Run the app:

   ```bash
   ./run.sh
   ```

2. Open <http://127.0.0.1:8031/> (API docs at `/docs`).
3. Pick `Heatwave + grid stress` or `Flood + blocked roads`, or edit the seeded
   incident's zones with the sliders.
4. Watch the priority queue, map, and metrics recompute, then `Commit dispatch`,
   `Copy brief`, or `Export PNG`.
5. Optional quality gate: `./.venv/bin/python qa.py` (expect 27 passed, 0 failed).

## Links To Fill Before Final Submission

- GitHub repository: https://github.com/sueun-dev/reliefgrid-beyond-tomorrow
- Demo video: _record from the running app (see `demo-script.md`)_
- Live demo: _local full-stack app, or deploy the FastAPI service (see `SUBMIT_RUNBOOK.md`)_
