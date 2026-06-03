# ReliefGrid Judge Brief

Checked against the official Beyond Tomorrow Summit 30094 page on June 3, 2026.

## Current Competition Snapshot

- Official deadline: June 5, 2026, 11:45 PM EDT.
- Public, online, students-only eligibility.
- Prize pool: $1,750 in cash.
- Required deliverables: project description, demo video, GitHub repository,
  presentation / pitch deck, screenshots, and technology stack.

## Submission Angle

Lead with this:

> ReliefGrid turns scattered emergency signals into a ranked dispatch brief, so local
> teams know which zone gets scarce supplies first and why — backed by a real API and
> a database, not just a single screen.

Do not frame it as a generic dashboard. The strongest angle is **transparent crisis
prioritization with an operational output, delivered as a genuine full stack.**

## What The Hackathon Wants

A future-facing working prototype that solves a real problem and can be judged on
originality, technical execution, real-world impact, scalability, usability, and clear
presentation. Position ReliefGrid as:

- Social Impact Solutions
- Smart Automation
- Healthcare Technology
- Sustainability / Climate Innovation
- Data & Analytics Platforms

The current strongest fit is climate / public-health emergency coordination with
transparent automation.

## Rubric Mapping

### Innovation & Creativity (25%)

An emergency-coordination tool focused on the decision gap between reports and action.
The dispatch brief — top zone, why, first-hour plan, fallback — is the differentiator.

### Technical Implementation (25%)

A real full stack: **FastAPI** REST backend with auto-generated OpenAPI docs, a
**SQLite** database via **SQLAlchemy 2.0** persisting incidents, zones, and committed
dispatches, a **pure, unit-tested scoring engine**, and a single-page frontend that
recomputes through the API on every edit. An in-process **27-check QA gate**
(`qa.py`) covers scoring, CRUD, ranking, persistence, validation, and serving.
Open `/docs` to drive the API live during judging.

### Real-World Impact & Scalability (25%)

Targets heatwaves, floods, clinic outages, and community resource shortages. Local-first
so it works when accounts/cloud/connectivity are limited, and the API + DB design
extends cleanly to multiple incidents, teams, and a hosted deployment.

### Design, Presentation & UX (25%)

A focused mission-control interface. The first screen is the operating surface — top
mission, response map, priority queue, metrics, and first-hour plan — with immediate,
server-backed feedback on every edit.

## Talking Points (technical execution)

- Scoring is server-side and **fully inspectable**; show a slider edit changing the
  ranking, then the same call in `/docs`.
- `Commit dispatch` writes an immutable snapshot — show the timestamped history (audit
  trail) and explain it persists across reloads with no account.
- `qa.py` proves correctness deterministically (27/27), including exact score fixtures.

## Main Risk / To-Do

- External deliverables (GitHub push, demo video, screenshots of the **new** UI) still
  need to be produced by the user before final submit.
- Decide the live-demo link: local run during judging, or a hosted FastAPI deploy
  (see `SUBMIT_RUNBOOK.md`).
