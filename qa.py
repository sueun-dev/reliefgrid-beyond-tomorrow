#!/usr/bin/env python3
"""ReliefGrid end-to-end QA gate.

Runs against an isolated temporary database (never your real data) using FastAPI's
in-process TestClient. The core suite needs NO network: seeding is skipped and the
scoring engine is checked against fixed, hand-built fixtures. A final best-effort
section exercises the live Open-Meteo data path only when the internet is reachable.

    python qa.py            # exits 0 on success, 1 on any failure

Covers:
  * pure scoring-engine math (deterministic fixtures),
  * full incident/zone CRUD,
  * live ranking recompute reacting to edits,
  * dispatch commit + history persistence,
  * input validation + 404 handling,
  * static frontend + OpenAPI docs are served,
  * (online only) real geocoding + weather-backed zone creation.
"""

from __future__ import annotations

import os
import sys
import tempfile
from types import SimpleNamespace

# Point the app at a throwaway DB and skip live seeding BEFORE importing it.
_TMP_DB = os.path.join(tempfile.mkdtemp(prefix="reliefgrid-qa-"), "qa.db")
os.environ["RELIEFGRID_DATABASE_URL"] = f"sqlite:///{_TMP_DB}"
os.environ["RELIEFGRID_SKIP_SEED"] = "1"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient  # noqa: E402

from backend.app import scoring  # noqa: E402
from backend.app.main import app  # noqa: E402

PASS, FAIL = 0, 0


def check(label: str, condition: bool, detail: str = "") -> None:
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  \033[32m✓\033[0m {label}")
    else:
        FAIL += 1
        print(f"  \033[31m✗\033[0m {label}  {detail}")


def section(title: str) -> None:
    print(f"\n\033[1m{title}\033[0m")


def _zone(**kw):
    kw.setdefault("id", None)
    kw.setdefault("x", 0.5)
    kw.setdefault("y", 0.5)
    return SimpleNamespace(**kw)


def _heat_fixture():
    """Deterministic neighbourhood-scale fixture (independent of live data)."""
    return SimpleNamespace(
        name="Heatwave fixture", time_window=12, transport_mode="van",
        water_kits=68, medical_kits=24, cooling_units=11, field_teams=5,
        zones=[
            _zone(name="Northside Towers", need="Cooling", residents=420, vulnerable=78, severity=92, distance=18, comms=35),
            _zone(name="East Clinic", need="Medical", residents=180, vulnerable=64, severity=84, distance=10, comms=72),
            _zone(name="River School", need="Water", residents=310, vulnerable=42, severity=74, distance=24, comms=56),
            _zone(name="Market Block", need="Water", residents=520, vulnerable=28, severity=68, distance=14, comms=62),
        ],
    )


def _flood_fixture():
    return SimpleNamespace(
        name="Flood fixture", time_window=6, transport_mode="mixed",
        water_kits=52, medical_kits=31, cooling_units=4, field_teams=6,
        zones=[
            _zone(name="Lowbank Homes", need="Medical", residents=260, vulnerable=68, severity=90, distance=12, comms=28),
            _zone(name="Bridge Shelter", need="Water", residents=610, vulnerable=51, severity=86, distance=17, comms=44),
            _zone(name="West Pump", need="Power", residents=190, vulnerable=34, severity=78, distance=26, comms=60),
            _zone(name="Clinic Annex", need="Medical", residents=120, vulnerable=73, severity=82, distance=9, comms=80),
        ],
    )


def main() -> int:
    # ── 1. Pure scoring engine (deterministic, offline) ───────────────────
    section("Scoring engine (fixed fixtures)")
    heat = _heat_fixture()
    r = scoring.compute(heat)
    top = r["ranked"][0]
    check("heatwave top zone is Northside Towers", top["name"] == "Northside Towers", top["name"])
    check("heatwave top score == 93 at 12h", top["score"] == 93, str(top["score"]))
    check("coverage == 100, residual risk == 35",
          r["metrics"]["coverage"] == 100 and r["metrics"]["residual_risk"] == 35, str(r["metrics"]))
    check("ranking is sorted descending",
          all(r["ranked"][i]["score"] >= r["ranked"][i + 1]["score"] for i in range(len(r["ranked"]) - 1)))
    heat.time_window = 6
    check("tighter window (6h) raises top score to 104", scoring.compute(heat)["ranked"][0]["score"] == 104)
    flood = scoring.compute(_flood_fixture())["ranked"][0]
    check("flood top zone is Lowbank Homes @ 99", flood["name"] == "Lowbank Homes" and flood["score"] == 99, str(flood))

    with TestClient(app) as client:
        return _api_checks(client)


def _api_checks(client) -> int:
    # ── 2. Health (no seed in test mode) ──────────────────────────────────
    section("API: health")
    h = client.get("/api/health").json()
    check("health ok + database connected", h["status"] == "ok" and h["database"] == "connected")

    # ── 3. Incident + zone CRUD (manual, offline) ─────────────────────────
    section("API: incident & zone CRUD")
    created = client.post("/api/incidents", json={
        "name": "QA Flood", "kind": "flood", "time_window": 6, "transport_mode": "mixed",
        "water_kits": 52, "medical_kits": 31, "cooling_units": 4, "field_teams": 6,
        "zones": [
            {"name": "Lowbank Homes", "need": "Medical", "residents": 260, "vulnerable": 68, "severity": 90, "distance": 12, "comms": 28, "x": 0.26, "y": 0.68},
            {"name": "Bridge Shelter", "need": "Water", "residents": 610, "vulnerable": 51, "severity": 86, "distance": 17, "comms": 44, "x": 0.52, "y": 0.36},
            {"name": "West Pump", "need": "Power", "residents": 190, "vulnerable": 34, "severity": 78, "distance": 26, "comms": 60, "x": 0.78, "y": 0.64},
            {"name": "Clinic Annex", "need": "Medical", "residents": 120, "vulnerable": 73, "severity": 82, "distance": 9, "comms": 80, "x": 0.35, "y": 0.22},
        ],
    }).json()
    iid = created["id"]
    check("create incident with 4 zones", len(created["zones"]) == 4)

    patched = client.patch(f"/api/incidents/{iid}", json={"transport_mode": "bike", "time_window": 6}).json()
    check("patch incident params", patched["transport_mode"] == "bike" and patched["time_window"] == 6)

    zone = client.post(f"/api/incidents/{iid}/zones", json={
        "name": "QA Tent", "need": "Medical", "residents": 300, "vulnerable": 90,
        "severity": 95, "distance": 4, "comms": 30, "x": 0.5, "y": 0.9,
    }).json()
    check("add zone returns id + position", "id" in zone and zone["position"] == 4)
    zid = zone["id"]
    upd = client.patch(f"/api/zones/{zid}", json={"severity": 10}).json()
    check("patch zone", upd["severity"] == 10)

    # ── 4. Ranking reacts to edits ────────────────────────────────────────
    section("API: live ranking")
    rank = client.get(f"/api/incidents/{iid}/ranking").json()
    check("ranking returns all 5 zones", len(rank["ranked"]) == 5)
    check("ranking has a top mission + 4-step plan",
          rank["top_mission"] is not None and len(rank["action_plan"]) == 4)
    client.patch(f"/api/zones/{zid}", json={"severity": 100, "vulnerable": 100, "comms": 0})
    rank2 = client.get(f"/api/incidents/{iid}/ranking").json()
    check("boosting a zone makes it the new #1", rank2["ranked"][0]["id"] == zid, str(rank2["ranked"][0]["name"]))

    # ── 5. Dispatch commit + history ──────────────────────────────────────
    section("API: dispatch commit & history")
    plan = client.post(f"/api/incidents/{iid}/dispatch").json()
    check("commit dispatch persists a plan", "id" in plan and plan["impact_score"] >= 0)
    plans = client.get(f"/api/incidents/{iid}/dispatch-plans").json()
    check("dispatch history lists the committed plan", len(plans) == 1 and plans[0]["id"] == plan["id"])

    # ── 6. Validation + error handling ────────────────────────────────────
    section("API: validation & errors")
    check("invalid need rejected (422)",
          client.post(f"/api/incidents/{iid}/zones", json={"name": "x", "need": "Pizza"}).status_code == 422)
    check("invalid time_window rejected (422)",
          client.patch(f"/api/incidents/{iid}", json={"time_window": 99}).status_code == 422)
    check("ranking unknown incident -> 404",
          client.get("/api/incidents/999999/ranking").status_code == 404)
    check("delete zone -> 204", client.delete(f"/api/zones/{zid}").status_code == 204)
    check("delete incident -> 204", client.delete(f"/api/incidents/{iid}").status_code == 204)

    # ── 7. Frontend + docs served ─────────────────────────────────────────
    section("Static frontend & docs")
    index = client.get("/")
    check("index.html served at /", index.status_code == 200 and "ReliefGrid" in index.text)
    check("app.js served", client.get("/js/app.js").status_code == 200)
    check("stylesheet served", client.get("/css/styles.css").status_code == 200)
    check("OpenAPI schema served", client.get("/openapi.json").status_code == 200)

    # ── 8. Live real-world data (best effort — skipped offline) ────────────
    section("Live data (Open-Meteo, online only)")
    status = client.get("/api/live/status").json()
    if not status.get("reachable"):
        print("  \033[33m∼\033[0m live provider unreachable — skipping online checks")
    else:
        check("live status reachable", status["reachable"] is True)
        cands = client.get("/api/live/geocode", params={"q": "Phoenix"}).json()
        check("geocode returns real candidates with coords",
              len(cands) > 0 and cands[0]["latitude"] is not None)
        inc = client.post("/api/incidents", json={"name": "Live QA", "kind": "heatwave"}).json()
        z = client.post(f"/api/incidents/{inc['id']}/zones/from-place", json={"place": "Mesa", "need": "Cooling"})
        check("from-place creates a real zone (201)", z.status_code == 201, z.text[:120])
        if z.status_code == 201:
            zj = z.json()
            check("real zone carries provenance + coords",
                  zj.get("data_source") and zj.get("latitude") is not None and zj.get("population"),
                  str({k: zj.get(k) for k in ("data_source", "latitude", "population")}))
        client.delete(f"/api/incidents/{inc['id']}")

    print(f"\n\033[1mResult:\033[0m {PASS} passed, {FAIL} failed")
    return 1 if FAIL else 0


if __name__ == "__main__":
    raise SystemExit(main())
