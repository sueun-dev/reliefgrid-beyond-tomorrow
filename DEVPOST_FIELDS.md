# Devpost Fields

Use this as the paste-ready field guide. Do not click final submit from an automated tool.

## Project Name

ReliefGrid

## Tagline

Prioritize response before the crisis spreads.

## Built With

Python, FastAPI, Uvicorn, SQLAlchemy, SQLite, Pydantic, HTML, CSS, JavaScript (ES modules), Canvas API

## Hackathon Fit

ReliefGrid is built for the Beyond Tomorrow Summit prompt as a social impact, smart automation, and healthcare / climate resilience project. The official challenge asks for future-facing technology that solves real-world problems with innovation, technical execution, scalability, usability, and a clear problem-solving approach. ReliefGrid focuses on the emergency coordination gap: when a community has limited supplies, weak communications, and several urgent zones at once, the app helps responders make the first decision faster and explain it clearly — backed by a real API and database, not just a single screen.

## Project Description

ReliefGrid helps local teams decide where limited emergency supplies should go first. It turns noisy crisis signals into a dispatch brief: the top response zone, why it is first, which supplies to send, what to do in the first operating hour, and what fallback to use if the plan slips.

It is a real full-stack application: a FastAPI backend computes the priority scoring server-side, a SQLite database persists incidents, zones, and every committed dispatch, and a single-page frontend drives it through a documented REST API (browsable at `/docs`). The prototype is built for heatwaves, floods, clinic outages, and community resource shortages where responders need a clear decision faster than a full command center can be assembled.

## Problem

In fast-moving local emergencies, teams often have scarce supplies, incomplete communications, and several neighborhoods that all seem urgent. Without a shared priority model, the first response can go to the loudest report instead of the highest-risk zone.

## Solution Overview

ReliefGrid scores each response zone using severity, vulnerable residents, population exposure, comms reliability, resource fit, and travel friction, scaled by how tight the operating window is. It shows the priority route on a response map and produces a dispatch brief that can be committed to a database, copied, or exported as a PNG. Because scoring runs on the server and data is persisted, teams can revisit incidents and audit every committed dispatch.

## Key Features

1. Heatwave and flood scenarios, seeded automatically into the database.
2. Editable incident setup, resource pool, and per-zone signals (live sliders).
3. Transparent, server-side priority scoring that recomputes on every edit.
4. Response map with ranked routes from the relief hub.
5. Impact / coverage / residual-risk metrics.
6. Dispatch brief with first-hour action plan and explicit fallback.
7. Commit dispatches to the database with timestamped history (audit trail).
8. Copy brief and PNG export.
9. Interactive, self-documenting REST API at `/docs`.

## Intended Impact

ReliefGrid helps community teams move from scattered signals to a shared first move. It runs locally, keeps the output simple enough to hand off quickly, and — because it is a real service with persistence — extends cleanly toward multi-team, hosted coordination.

## Technology Stack

Backend: Python, FastAPI, Uvicorn, SQLAlchemy 2.0 ORM, Pydantic, SQLite.
Frontend: HTML, CSS, JavaScript (ES modules), Canvas API.
Testing: in-process FastAPI TestClient QA suite (27 checks).

## Category Positioning

Primary: Social Impact Solutions, Smart Automation, Healthcare Technology, Sustainability / Climate Innovation.

Secondary: Data & Analytics Platforms, Productivity Solutions.

## Required Links To Fill

- GitHub repository: https://github.com/sueun-dev/reliefgrid-beyond-tomorrow
- Demo video: _record a 60–75s walkthrough from the running app (see `demo-script.md`)_
- Live demo: _run locally via `./run.sh`, or deploy the FastAPI service (see `SUBMIT_RUNBOOK.md`)_
- Screenshots: capture from the running app at <http://127.0.0.1:8031/>

The official page asks for a GitHub repository, demo video, pitch deck, and screenshots. Preview the final Devpost page before submit.
