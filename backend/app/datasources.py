"""Open-Meteo data access.

Geocoding (coordinates + population) and forecast (apparent temperature,
precipitation) from the free, key-free Open-Meteo APIs. Severity is derived from
the weather values with the formula below; distance is great-circle km. comms%
and vulnerable% have no public source, so the operator enters those.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Dict, List

import httpx

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
TIMEOUT = 12.0

# Map-canvas projection: places are positioned on a 0-1 canvas relative to the
# relief hub, then clamped to a margin so markers never sit on the edge.
CANVAS_SCALE = 1.4
CANVAS_MIN = 0.06
CANVAS_MAX = 0.94

# Heat severity is mapped from apparent ("feels-like") temperature in °C.
# 22 °C and below → 0 (no heat stress); 47 °C → 100 (extreme danger).
HEAT_BASE_C = 22.0
HEAT_PEAK_C = 47.0
# Flood severity is mapped from today's total precipitation in mm.
# ~77 mm/day → 100. (Heavy-rain/flash-flood territory.)
FLOOD_MM_FOR_100 = 77.0


class LiveDataError(RuntimeError):
    """Raised when a real data source is unreachable or returns nothing usable."""


def _clamp_int(value: float, low: int = 0, high: int = 100) -> int:
    return int(max(low, min(high, round(value))))


def place_label(place: Dict[str, Any], *, include_country: bool = False) -> str:
    """Human-readable 'name, admin1[, country]' label, skipping missing parts."""
    parts = [place.get("name"), place.get("admin1")]
    if include_country:
        parts.append(place.get("country"))
    return ", ".join(p for p in parts if p)


def project_to_canvas(lat: float, lon: float, hub_lat: float, hub_lon: float) -> tuple[float, float]:
    """Place a real coordinate on the 0-1 map canvas, relative to the hub."""
    x = 0.5 + (lon - hub_lon) * CANVAS_SCALE
    y = 0.5 - (lat - hub_lat) * CANVAS_SCALE
    x = max(CANVAS_MIN, min(CANVAS_MAX, x))
    y = max(CANVAS_MIN, min(CANVAS_MAX, y))
    return round(x, 4), round(y, 4)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres between two real coordinates."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return round(2 * r * math.asin(math.sqrt(a)), 1)


def heat_severity(apparent_temp_max_c: float) -> int:
    """Real apparent-temperature → 0-100 heat-danger score (linear, disclosed)."""
    return _clamp_int((apparent_temp_max_c - HEAT_BASE_C) / (HEAT_PEAK_C - HEAT_BASE_C) * 100)


def flood_severity(precipitation_sum_mm: float) -> int:
    """Real daily precipitation → 0-100 flood-pressure score (linear, disclosed)."""
    return _clamp_int(precipitation_sum_mm / FLOOD_MM_FOR_100 * 100)


def geocode(query: str, count: int = 5) -> List[Dict[str, Any]]:
    """Resolve a place name to real candidates with coordinates and population."""
    try:
        resp = httpx.get(
            GEOCODE_URL,
            params={"name": query, "count": count, "language": "en", "format": "json"},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise LiveDataError(f"Geocoding service unreachable: {exc}") from exc

    results = resp.json().get("results") or []
    out: List[Dict[str, Any]] = []
    for r in results:
        out.append({
            "name": r.get("name"),
            "admin1": r.get("admin1"),
            "country": r.get("country"),
            "country_code": r.get("country_code"),
            "latitude": r.get("latitude"),
            "longitude": r.get("longitude"),
            "population": r.get("population"),
        })
    return out


def geocode_one(query: str) -> Dict[str, Any]:
    """First geocoding match, or raise if the place can't be resolved."""
    matches = geocode(query, count=1)
    if not matches:
        raise LiveDataError(f"No place found for '{query}'")
    return matches[0]


def geocode_near(query: str, hub_lat: float, hub_lon: float) -> Dict[str, Any]:
    """Best geocoding match nearest a reference point.

    Disambiguates common names (e.g. 'Beaumont') by choosing the candidate
    closest to the relief hub, so seed scenarios resolve to the intended city.
    """
    matches = [m for m in geocode(query, count=6) if m.get("latitude") is not None]
    if not matches:
        raise LiveDataError(f"No place found for '{query}'")
    return min(matches, key=lambda m: haversine_km(hub_lat, hub_lon, m["latitude"], m["longitude"]))


def fetch_weather(lat: float, lon: float) -> Dict[str, Any]:
    """Real current + today's forecast for a coordinate."""
    try:
        resp = httpx.get(
            FORECAST_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,apparent_temperature,precipitation",
                "daily": "apparent_temperature_max,precipitation_sum,wind_speed_10m_max",
                "forecast_days": 1,
                "timezone": "auto",
            },
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise LiveDataError(f"Weather service unreachable: {exc}") from exc

    data = resp.json()
    current = data.get("current") or {}
    daily = data.get("daily") or {}

    def _first(key: str):
        seq = daily.get(key) or []
        return seq[0] if seq else None

    return {
        "observed_at": current.get("time"),
        "temperature_c": current.get("temperature_2m"),
        "apparent_temperature_c": current.get("apparent_temperature"),
        "precipitation_mm": current.get("precipitation"),
        "apparent_temperature_max_c": _first("apparent_temperature_max"),
        "precipitation_sum_mm": _first("precipitation_sum"),
        "wind_speed_max": _first("wind_speed_10m_max"),
    }


def build_zone_signals(kind: str, place: Dict[str, Any], hub_lat: float, hub_lon: float) -> Dict[str, Any]:
    """Turn a real geocoded place + real weather into real zone signals.

    Returns the measured fields (severity, residents, distance, coords) plus a
    human-readable provenance string. Operator-only fields (vulnerable, comms)
    are deliberately left out - the caller defaults them to 0 for the operator.
    """
    lat, lon = place["latitude"], place["longitude"]
    weather = fetch_weather(lat, lon)

    if str(kind).lower() == "flood":
        severity = flood_severity(weather.get("precipitation_sum_mm") or 0.0)
        basis = f"precipitation {weather.get('precipitation_sum_mm')} mm/day"
    else:
        app_max = weather.get("apparent_temperature_max_c")
        if app_max is None:
            app_max = weather.get("apparent_temperature_c") or 0.0
        severity = heat_severity(app_max)
        basis = f"apparent temp {app_max} °C"

    distance = haversine_km(hub_lat, hub_lon, lat, lon)
    population = place.get("population")
    stamp = weather.get("observed_at") or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M")
    label = place_label(place, include_country=True)

    return {
        "latitude": lat,
        "longitude": lon,
        "population": population,
        "residents": int(population) if population else 0,
        "severity": severity,
        "distance": distance,
        "severity_basis": basis,
        "data_source": f"Open-Meteo · {label} · {basis} · observed {stamp}",
        "weather": weather,
    }
