"""Zone priority scoring.

Ranks response zones by severity, vulnerable population, exposure, comms
reliability and resource fit, minus a travel penalty, scaled by the operating
window. Kept as plain functions so it's easy to test.
"""

from __future__ import annotations

from typing import Any, Dict, List

# scoring weights
W_SEVERITY = 0.44
W_VULNERABLE = 0.28
W_EXPOSURE = 0.18
W_SIGNAL_RISK = 0.18
W_FIT = 0.20

TRANSPORT_FACTOR = {"bike": 1.2, "mixed": 0.85, "van": 0.65}

VALID_NEEDS = ("Water", "Medical", "Cooling", "Power")
VALID_TIME_WINDOWS = (6, 12, 24)
VALID_TRANSPORT_MODES = ("bike", "van", "mixed")


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def resource_fit(need: str, residents: float, vulnerable: float, resources: Dict[str, float]) -> float:
    """How well the available supplies cover a zone's dominant need (0-100)."""
    water = resources.get("water_kits", 0)
    medical = resources.get("medical_kits", 0)
    cooling = resources.get("cooling_units", 0)

    if need == "Water":
        return min(100.0, water / max(1.0, residents / 8) * 100)
    if need == "Medical":
        return min(100.0, medical / max(1.0, vulnerable / 4) * 100)
    if need == "Cooling":
        return min(100.0, cooling / max(1.0, vulnerable / 10) * 100)
    # Power / other: blended water + medical coverage against population.
    return min(100.0, (medical + water) / max(1.0, residents / 10) * 100)


def transport_penalty(distance: float, transport_mode: str) -> float:
    """Travel friction cost - slower modes and longer distances cost more."""
    factor = TRANSPORT_FACTOR.get(transport_mode, 0.85)
    return distance * factor


def time_pressure(time_window: int) -> float:
    """Tighter windows raise urgency; long windows relax it."""
    if time_window <= 6:
        return 1.12
    if time_window >= 24:
        return 0.92
    return 1.0


def score_zone(zone: Dict[str, Any], time_window: int, transport_mode: str, resources: Dict[str, float]) -> int:
    """Composite priority score for a single zone (>= 0, rounded)."""
    exposure = (
        zone["severity"] * W_SEVERITY
        + zone["vulnerable"] * W_VULNERABLE
        + min(100.0, zone["residents"] / 7) * W_EXPOSURE
    )
    signal_risk = (100 - zone["comms"]) * W_SIGNAL_RISK
    fit = resource_fit(zone["need"], zone["residents"], zone["vulnerable"], resources) * W_FIT
    raw = (exposure + signal_risk + fit - transport_penalty(zone["distance"], transport_mode)) * time_pressure(time_window)
    return max(0, round(raw))


def _zone_to_dict(zone: Any) -> Dict[str, Any]:
    """Accept ORM Zone objects or plain dicts uniformly."""
    if isinstance(zone, dict):
        return zone
    return {
        "id": getattr(zone, "id", None),
        "position": getattr(zone, "position", 0),
        "name": zone.name,
        "need": zone.need,
        "residents": zone.residents,
        "vulnerable": zone.vulnerable,
        "severity": zone.severity,
        "distance": zone.distance,
        "comms": zone.comms,
        "x": zone.x,
        "y": zone.y,
        # Carry real-world provenance through ranking so the API stays consistent
        # with the RankedZone schema (population, coords, data source).
        "latitude": getattr(zone, "latitude", None),
        "longitude": getattr(zone, "longitude", None),
        "population": getattr(zone, "population", None),
        "severity_basis": getattr(zone, "severity_basis", None),
        "data_source": getattr(zone, "data_source", None),
    }


def _resources(incident: Any) -> Dict[str, float]:
    return {
        "water_kits": getattr(incident, "water_kits", 0),
        "medical_kits": getattr(incident, "medical_kits", 0),
        "cooling_units": getattr(incident, "cooling_units", 0),
        "field_teams": getattr(incident, "field_teams", 1),
    }


def make_action_plan(top: Dict[str, Any], ranked: List[Dict[str, Any]], resources: Dict[str, float]) -> List[str]:
    """First-operating-hour checklist grounded in the ranked results."""
    field_teams = int(resources.get("field_teams", 1) or 1)
    second = ranked[1] if len(ranked) > 1 else top
    need_lower = str(top["need"]).lower()
    return [
        f"Dispatch {max(1, -(-field_teams // 2))} field teams to {top['name']} with {need_lower} supplies.",
        f"Reserve one team for {second['name']}; it is the next-highest risk zone at score {second['score']}.",
        f"Send a confirmation runner if comms are below 50; {top['name']} comms are at {top['comms']}%.",
        f"Fallback: if {need_lower} stock runs short, split delivery by vulnerable residents first.",
    ]


def compute(incident: Any) -> Dict[str, Any]:
    """Full dispatch computation for an incident.

    Returns the ranked zones, headline mission, metrics, action plan, and a
    plain-text brief - everything the UI and a saved DispatchPlan need.
    """
    resources = _resources(incident)
    time_window = int(getattr(incident, "time_window", 12) or 12)
    transport_mode = getattr(incident, "transport_mode", "van") or "van"

    zones = [_zone_to_dict(z) for z in incident.zones]
    ranked: List[Dict[str, Any]] = []
    for z in zones:
        fit = resource_fit(z["need"], z["residents"], z["vulnerable"], resources)
        ranked.append({
            **z,
            "score": score_zone(z, time_window, transport_mode, resources),
            "fit": round(fit),
        })
    ranked.sort(key=lambda z: z["score"], reverse=True)

    if not ranked:
        return {
            "ranked": [],
            "metrics": {"impact": 0, "coverage": 0, "residual_risk": 100},
            "top_mission": None,
            "action_plan": [],
            "brief_text": "No response zones defined yet. Add at least one zone to generate a dispatch brief.",
        }

    top = ranked[0]
    coverage = round(sum(z["fit"] for z in ranked) / len(ranked))
    residual_risk = max(0, round(100 - coverage * 0.45 - resources.get("field_teams", 0) * 4))
    action_plan = make_action_plan(top, ranked, resources)

    incident_name = getattr(incident, "name", "Incident")
    top_mission = {
        "title": f"Send {str(top['need']).lower()} support to {top['name']} first.",
        "detail": (
            f"{top['name']} has the strongest combined signal: severity {top['severity']}, "
            f"{top['vulnerable']}% vulnerable residents, {top['distance']} km travel, and "
            f"{top['comms']}% comms reliability."
        ),
    }

    brief_text = "\n".join([
        f"ReliefGrid dispatch brief: {incident_name}",
        f"Top mission: send {str(top['need']).lower()} support to {top['name']}.",
        (
            f"Why: score {top['score']}, severity {top['severity']}, vulnerable {top['vulnerable']}%, "
            f"comms {top['comms']}%, distance {top['distance']} km."
        ),
        "First hour: " + " ".join(action_plan),
    ])

    return {
        "ranked": ranked,
        "metrics": {"impact": top["score"], "coverage": coverage, "residual_risk": residual_risk},
        "top_mission": top_mission,
        "action_plan": action_plan,
        "brief_text": brief_text,
    }
