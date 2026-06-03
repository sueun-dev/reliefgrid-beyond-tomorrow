# ReliefGrid Demo Script

Record from the running full-stack app (`./run.sh` → <http://127.0.0.1:8031/>).
Tip: open in a fresh browser profile so the welcome overlay appears on cue.

## 60–75 Second Cut

### 0:00–0:10 — Hook + what it is
"ReliefGrid is for local emergency teams with scarce supplies and several urgent
areas at once — it decides who to help first."

Open the app. The welcome overlay shows the 3 steps (Add real locations → Review the
priority → Commit & share). Click **Got it**.

### 0:10–0:25 — Real data, not dummy data  ← the differentiator
"Every response zone is a real place. Population, severity, and distance are pulled
live from Open-Meteo — nothing is fabricated."

Point at a zone card: **Population — LIVE**, **Distance — COMPUTED**, **Severity —
DERIVED**, and the source line (`Open-Meteo · Mesa, Arizona · apparent temp 40.8 °C ·
observed …`). Point at the legend: live / derived / you report.

### 0:25–0:38 — Add a real location, live
"Add anywhere on Earth." Click **Add location**, type a real city, pick a candidate.

It geocodes, pulls live weather, computes the real distance from the relief hub, and
drops it into the ranking — in real time.

### 0:38–0:52 — Transparent scoring
"You report the two signals with no public feed — % vulnerable residents and %
working comms. Everything else is real. ReliefGrid ranks the zones server-side on a
fully inspectable rule and recomputes on every change."

Drag a Vulnerable/Comms slider; the priority queue, response map, and the three
metrics (impact / coverage / residual risk) update instantly.

### 0:52–1:05 — The dispatch brief + real backend
"The output is a dispatch brief: the top zone, why it wins, a first-hour action plan,
and a fallback. It's a real full stack — commit it and it's saved to the database
with a timestamped history."

Show the top-mission card and action plan → click **Commit dispatch** (it appears in
history) → flash **/docs** (the live Swagger API).

### 1:05–1:15 — Close
"Export the brief as a PNG to hand off. Real data, transparent scoring, one clear
first move — prioritize response before the crisis spreads."

Click **Export PNG**; end on the receipt.

---

## One-liner for Devpost
> ReliefGrid turns **real, live data** (Open-Meteo geocoding + weather) into a clear
> emergency dispatch brief — a genuine FastAPI + SQLite full stack with transparent,
> inspectable scoring and honest data provenance on every field.
