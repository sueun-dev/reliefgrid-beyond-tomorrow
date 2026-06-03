# Devpost Fields

Paste-ready field guide for the Beyond Tomorrow Summit submission.
Do **not** click final submit from an automated tool — review on the Devpost page first.

## Project Name

ReliefGrid

## Tagline

Real-data emergency dispatch — decide who to help first when resources are scarce.

## Elevator Pitch (Devpost short description, ≤ 200 chars)

ReliefGrid turns live real-world data into one clear emergency decision: who to help
first, why, and what to do in the first hour — a real FastAPI + SQLite full stack.

## Built With

Python, FastAPI, Uvicorn, SQLAlchemy, SQLite, Pydantic, httpx, Open-Meteo API
(geocoding + weather), HTML, CSS, JavaScript (ES modules), Canvas API, Docker

## Inspiration

Local emergencies rarely fail because nobody cares — they fail because the team has
incomplete signals, scarce supplies, weak comms, and no shared priority order. We
wanted a tool that makes that first tradeoff explicit and defensible, using **real
data** instead of a hand-waved demo.

## What it does

ReliefGrid helps local teams decide where limited emergency supplies should go first.
It turns crisis signals into a dispatch brief: the top response zone, why it is first,
which supplies to send, the first-hour action plan, and a fallback if the plan slips.

Every response zone is a **real place**. Its coordinates, population, and travel
distance are pulled live from the public Open-Meteo geocoding API, and a heat/flood
**severity** signal is derived from live weather (apparent temperature / precipitation).
Nothing is fabricated — the only operator-entered signals are the two with no public
real-time feed (% vulnerable residents and % working comms), and the UI labels every
field as **live**, **derived**, or **you report** so the data provenance is honest.

## How we built it

A real full stack:
- **Backend** — FastAPI computes the priority scoring server-side; a transparent,
  unit-tested rule (severity, vulnerable residents, exposure, comms, resource fit,
  travel friction, scaled by the operating window). Self-documenting REST API at `/docs`.
- **Database** — SQLite via SQLAlchemy 2.0 persists incidents, zones, and every
  committed dispatch as a timestamped audit trail.
- **Live data** — an Open-Meteo integration (httpx) geocodes real places, pulls live
  weather, and computes great-circle distances; the demo scenarios are seeded from
  real cities at first boot.
- **Frontend** — a guided single-page app (vanilla ES modules + Canvas) with onboarding,
  a 3-step flow, inline help, a data-source legend, response map, and PNG export.
- **Ops** — Dockerfile + render.yaml for one-click public deploy; a 29-check in-process
  QA gate.

## Challenges we ran into

Keeping the data honest. There is no public feed for "supplies on hand," comms
reliability, or % vulnerable residents, so rather than invent them we made those
explicit operator inputs and labelled everything by provenance — real where a real
source exists, operator-entered where it doesn't.

## Accomplishments / What makes it different

- **Real data, not dummy data** — live geocoding + weather for every zone.
- **Transparent scoring** — inspectable server-side rule, not a black box.
- **Honest provenance** — each field marked live / derived / operator-entered.
- **A real backend + database**, not a single-screen toy: persistence, audit history,
  and a documented API.

## What's next

Multi-team hosted coordination, real river-discharge flood modelling, and optional
integrations for live shelter/clinic capacity feeds.

## Category Positioning

Primary: Social Impact, Smart Automation, Healthcare Technology, Sustainability / Climate.
Secondary: Data & Analytics, Productivity.

## Required Links

- **GitHub repository:** https://github.com/sueun-dev/reliefgrid-beyond-tomorrow
- **Live demo:** _deploy in one click — README "Deploy to Render" button — then paste the `https://…onrender.com` URL here_
- **Demo video:** `reliefgrid-demo-video.mp4` (57s, new UI + real data, narrated with a local **Qwen3-TTS** model) — upload to YouTube/Vimeo and paste the link, or record your own screen walkthrough (`demo-script.md`)
- **Thumbnail / screenshots:** `reliefgrid-brief.png` (committed); capture the dashboard from the running app

> The official page asks for a GitHub repository, demo video, and screenshots.
> Preview the final Devpost page before submitting.
