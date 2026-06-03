// Thin typed-ish wrapper around the ReliefGrid REST API.
const BASE = "/api";

async function request(method, path, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json()).detail ?? detail; } catch { /* ignore */ }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => request("GET", "/health"),
  templates: () => request("GET", "/templates"),

  listIncidents: () => request("GET", "/incidents"),
  getIncident: (id) => request("GET", `/incidents/${id}`),
  createFromTemplate: (key) => request("POST", `/incidents/from-template/${key}`),
  updateIncident: (id, patch) => request("PATCH", `/incidents/${id}`, patch),
  deleteIncident: (id) => request("DELETE", `/incidents/${id}`),

  addZone: (incidentId, zone) => request("POST", `/incidents/${incidentId}/zones`, zone),
  updateZone: (zoneId, patch) => request("PATCH", `/zones/${zoneId}`, patch),
  deleteZone: (zoneId) => request("DELETE", `/zones/${zoneId}`),

  ranking: (id) => request("GET", `/incidents/${id}/ranking`),
  commitDispatch: (id) => request("POST", `/incidents/${id}/dispatch`),
  listDispatchPlans: (id) => request("GET", `/incidents/${id}/dispatch-plans`),

  // Live real-world data (Open-Meteo)
  liveStatus: () => request("GET", "/live/status"),
  geocode: (q) => request("GET", `/live/geocode?q=${encodeURIComponent(q)}`),
  addZoneFromPlace: (incidentId, body) =>
    request("POST", `/incidents/${incidentId}/zones/from-place`, body),
};
