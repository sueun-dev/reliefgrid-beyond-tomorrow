import { api } from "./api.js";
import { toast } from "./toast.js";
import { drawMap } from "./map.js";
import { buildReceiptDataUrl } from "./receipt.js";

// State
const state = {
  templates: [],
  incidents: [],
  incident: null, // full incident with zones
  ranking: null,
};

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 34; // r=34

const RESOURCES = [
  { key: "water_kits", label: "Water kits", min: 0, max: 400, step: 4, color: "#6aa5ff", icon: '<path d="M12 2.5S5 9 5 14a7 7 0 0 0 14 0c0-5-7-11.5-7-11.5z"/>' },
  { key: "medical_kits", label: "Medical kits", min: 0, max: 200, step: 2, color: "#fb7185", icon: '<path d="M12 5v14M5 12h14"/>' },
  { key: "cooling_units", label: "Cooling units", min: 0, max: 120, step: 1, color: "#34d399", icon: '<path d="M12 2v20M4 7l16 10M20 7L4 17"/>' },
  { key: "field_teams", label: "Field teams", min: 1, max: 60, step: 1, color: "#f5b53f", icon: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M16 6a3 3 0 0 1 0 6"/>' },
];

// Operator-reported signals (no public real-time source - the human fills these in).
const OPERATOR_SLIDERS = [
  { key: "vulnerable", label: "Vulnerable residents", min: 0, max: 100, step: 1, suffix: "%" },
  { key: "comms", label: "Working comms", min: 0, max: 100, step: 1, suffix: "%" },
];

const NEEDS = ["Water", "Medical", "Cooling", "Power"];

// Helpers
const $ = (id) => document.getElementById(id);

function debounce(fn, ms = 320) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* fall through */ }
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand("copy"); } catch { /* noop */ }
  ta.remove(); return ok;
}

// Status bar
async function refreshStatus() {
  const pill = $("statusPill");
  try {
    const h = await api.health();
    pill.className = "status-pill ok";
    $("statusText").textContent = `DB connected · ${h.incidents} incidents · ${h.zones} zones`;
  } catch {
    pill.className = "status-pill err";
    $("statusText").textContent = "backend offline";
  }
}

// Templates
function renderTemplates() {
  const box = $("templateBtns");
  box.innerHTML = "";
  state.templates.forEach((t) => {
    const b = document.createElement("button");
    b.innerHTML = `<strong>${t.label}</strong>`;
    b.title = t.description;
    b.addEventListener("click", () => loadTemplate(t.key));
    box.appendChild(b);
  });
}

async function loadTemplate(key) {
  try {
    const created = await api.createFromTemplate(key);
    await refreshIncidents();
    await loadIncident(created.id);
    await refreshStatus();
    toast(`Loaded scenario: ${created.name}`);
  } catch (e) { toast(e.message, "err"); }
}

// Incident select
async function refreshIncidents() {
  state.incidents = await api.listIncidents();
  const sel = $("incidentSelect");
  sel.innerHTML = "";
  state.incidents.forEach((inc) => {
    const o = document.createElement("option");
    o.value = inc.id;
    o.textContent = inc.name.length > 40 ? inc.name.slice(0, 38) + "…" : inc.name;
    sel.appendChild(o);
  });
  if (state.incident) sel.value = String(state.incident.id);
}

// Incident form
function renderIncidentForm(inc) {
  $("incidentName").value = inc.name;
  $("incidentSelect").value = String(inc.id);

  // segmented controls
  setSegmented("timeWindow", String(inc.time_window));
  setSegmented("transportMode", inc.transport_mode);

  // resource steppers
  const grid = $("resourceGrid");
  grid.innerHTML = "";
  RESOURCES.forEach((r) => {
    const wrap = document.createElement("div");
    wrap.className = "resource";
    wrap.innerHTML = `
      <div class="resource-top">
        <span class="resource-ico" style="background:${hexA(r.color, 0.14)};color:${r.color}">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${r.icon}</svg>
        </span>
        <span class="resource-name">${r.label}</span>
      </div>
      <div class="stepper">
        <button type="button" data-act="dec">−</button>
        <input type="number" value="${inc[r.key]}" min="${r.min}" max="${r.max}" step="${r.step}" />
        <button type="button" data-act="inc">+</button>
      </div>`;
    const input = wrap.querySelector("input");
    const commit = () => {
      let v = clamp(Number(input.value) || 0, r.min, r.max);
      input.value = v;
      state.incident[r.key] = v;
      patchIncident({ [r.key]: v });
    };
    wrap.querySelector('[data-act="dec"]').addEventListener("click", () => { input.value = clamp(Number(input.value) - r.step, r.min, r.max); commit(); });
    wrap.querySelector('[data-act="inc"]').addEventListener("click", () => { input.value = clamp(Number(input.value) + r.step, r.min, r.max); commit(); });
    input.addEventListener("input", debounce(commit, 300));
    grid.appendChild(wrap);
  });
}

function setSegmented(id, value) {
  [...$(id).children].forEach((b) => b.classList.toggle("active", b.dataset.value === value));
}

// Zones
function renderZones(inc) {
  const list = $("zoneList");
  list.innerHTML = "";
  inc.zones.forEach((zone) => list.appendChild(buildZoneCard(zone)));
  $("queueCount").textContent = `${inc.zones.length} zones`;
}

function buildZoneCard(zone) {
  const card = document.createElement("div");
  card.className = "zone-card";
  card.dataset.zoneId = zone.id;

  const needOpts = NEEDS.map((n) => `<option value="${n}" ${n === zone.need ? "selected" : ""}>${n}</option>`).join("");
  const live = !!zone.data_source;
  const pop = zone.population ?? zone.residents;

  card.innerHTML = `
    <div class="zone-card-head">
      <div class="zone-id">
        <span class="zone-name">${escapeHtml(zone.name)}</span>
        ${live ? '<span class="live-tag">LIVE</span>' : ""}
      </div>
      <select class="zone-need" aria-label="Need for this location">${needOpts}</select>
      <button class="zone-remove" title="Remove location" aria-label="Remove location">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="zone-measured" title="From live data - not hand-edited">
      <div class="meas"><span class="meas-k">Severity</span><span class="meas-v">${zone.severity}</span><span class="meas-src derived">derived</span></div>
      <div class="meas"><span class="meas-k">Population</span><span class="meas-v">${fmtInt(pop)}</span><span class="meas-src live">live</span></div>
      <div class="meas"><span class="meas-k">Distance</span><span class="meas-v">${zone.distance} km</span><span class="meas-src live">computed</span></div>
    </div>
    ${live ? `<div class="zone-source">📡 ${escapeHtml(zone.data_source)}</div>` : ""}
    <div class="zone-slabel">Field-reported <span class="help" tabindex="0" role="note" aria-label="Help: field-reported" data-tip="These two have no public live feed, so the operator reports them from the field.">i</span></div>
    <div class="zone-sliders"></div>`;

  const sliders = card.querySelector(".zone-sliders");
  OPERATOR_SLIDERS.forEach((s) => {
    const row = document.createElement("div");
    row.className = "slider-row";
    row.innerHTML = `
      <label>${s.label}</label>
      <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${zone[s.key]}" />
      <span class="val">${zone[s.key]}${s.suffix || ""}</span>`;
    const range = row.querySelector("input");
    const val = row.querySelector(".val");
    range.addEventListener("input", () => {
      val.textContent = range.value + (s.suffix || "");
      zone[s.key] = Number(range.value);
      patchZone(zone.id, { [s.key]: Number(range.value) });
    });
    sliders.appendChild(row);
  });

  card.querySelector(".zone-need").addEventListener("change", (e) => {
    zone.need = e.target.value;
    patchZone(zone.id, { need: e.target.value });
  });
  card.querySelector(".zone-remove").addEventListener("click", () => removeZone(zone.id));

  return card;
}

// Live location search
function toggleLocSearch(force) {
  const box = $("locSearch");
  const show = typeof force === "boolean" ? force : box.hidden;
  box.hidden = !show;
  if (show) { $("placeInput").focus(); }
  else { $("locResults").innerHTML = ""; }
}

async function searchPlaces() {
  const q = $("placeInput").value.trim();
  const ul = $("locResults");
  if (!q) { ul.innerHTML = ""; return; }
  ul.innerHTML = `<li class="loc-note">Searching real places…</li>`;
  try {
    const results = await api.geocode(q);
    if (!results.length) { ul.innerHTML = `<li class="loc-note">No real place matched “${escapeHtml(q)}”.</li>`; return; }
    ul.innerHTML = "";
    results.forEach((c) => {
      const li = document.createElement("li");
      li.className = "loc-item";
      const where = [c.admin1, c.country].filter(Boolean).join(", ");
      const pop = c.population ? `${fmtInt(c.population)} people` : "population n/a";
      li.innerHTML = `<div class="loc-main">${escapeHtml(c.name || q)}</div><div class="loc-sub">${escapeHtml(where)} · ${pop}</div>`;
      li.addEventListener("click", () => addFromCandidate(c));
      ul.appendChild(li);
    });
  } catch (e) {
    ul.innerHTML = `<li class="loc-note err">Live data error: ${escapeHtml(e.message)}</li>`;
  }
}

async function addFromCandidate(c) {
  $("locResults").innerHTML = `<li class="loc-note">Fetching live weather for ${escapeHtml(c.name)}…</li>`;
  try {
    await api.addZoneFromPlace(state.incident.id, {
      place: c.name,
      need: $("placeNeed").value,
      latitude: c.latitude,
      longitude: c.longitude,
      population: c.population,
      admin1: c.admin1,
    });
    $("placeInput").value = "";
    toggleLocSearch(false);
    await reloadCurrent();
    await refreshStatus();
    toast(`Added ${c.name} · live data`);
  } catch (e) {
    toast(e.message, "err");
    $("locResults").innerHTML = "";
  }
}

async function removeZone(zoneId) {
  try {
    await api.deleteZone(zoneId);
    await reloadCurrent();
    await refreshStatus();
    toast("Zone removed");
  } catch (e) { toast(e.message, "err"); }
}

// Patching (debounced server recompute)
const patchIncident = debounce(async (patch) => {
  try { await api.updateIncident(state.incident.id, patch); await refreshRanking(); }
  catch (e) { toast(e.message, "err"); }
}, 280);

const patchZone = debounce(async (zoneId, patch) => {
  try { await api.updateZone(zoneId, patch); await refreshRanking(); }
  catch (e) { toast(e.message, "err"); }
}, 280);

// Live recalculation badge
function setLive(mode) {
  const badge = $("liveBadge");
  const text = $("liveText");
  if (!badge) return;
  if (mode === "updating") {
    badge.classList.add("updating");
    if (text) text.textContent = "Updating…";
  } else {
    badge.classList.remove("updating");
    if (text) text.textContent = "Live";
  }
}

// Ranking / results
async function refreshRanking() {
  setLive("updating");
  try {
    state.ranking = await api.ranking(state.incident.id);
    renderResults(state.ranking);
  } finally {
    setLive("live");
  }
}

function renderResults(r) {
  const top = r.ranked[0];

  // Mission card
  if (top && r.top_mission) {
    $("missionTitle").textContent = r.top_mission.title;
    $("missionDetail").textContent = r.top_mission.detail;
    $("missionScore").textContent = top.score;
  } else {
    $("missionTitle").textContent = "No zones yet";
    $("missionDetail").textContent = "Add at least one response zone to generate a dispatch brief.";
    $("missionScore").textContent = "0";
  }

  // Metrics gauges
  setGauge("gaugeImpact", "impactScore", r.metrics.impact, 110);
  setGauge("gaugeCoverage", "coverageScore", r.metrics.coverage, 100);
  setGauge("gaugeRisk", "riskScore", r.metrics.residual_risk, 100);

  // Map
  drawMap($("mapCanvas"), r.ranked);

  // Priority queue
  const q = $("queue");
  q.innerHTML = "";
  const maxScore = top ? Math.max(top.score, 1) : 1;
  r.ranked.forEach((z, i) => {
    const li = document.createElement("li");
    if (i === 0) li.classList.add("top");
    li.innerHTML = `
      <span class="q-rank">${i + 1}</span>
      <div class="q-body">
        <div class="q-name">${escapeHtml(z.name)} <span class="q-tag">${z.need}</span></div>
        <div class="q-bar"><i style="width:${Math.round((z.score / maxScore) * 100)}%"></i></div>
        <div class="q-meta">severity ${z.severity} · ${z.vulnerable}% vulnerable · ${z.comms}% comms · ${z.distance} km · fit ${z.fit}%</div>
      </div>
      <span class="q-score">${z.score}</span>`;
    q.appendChild(li);
  });

  // Action plan
  const ap = $("actionPlan");
  ap.innerHTML = "";
  r.action_plan.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    ap.appendChild(li);
  });

  // Top-zone highlight in editor
  document.querySelectorAll(".zone-card").forEach((c) => {
    c.classList.toggle("is-top", top && String(c.dataset.zoneId) === String(top.id));
  });

  // hide stale receipt
  $("receiptPanel").hidden = true;
}

function setGauge(circleId, numId, value, scaleMax) {
  const ratio = clamp(value / scaleMax, 0, 1);
  $(circleId).style.strokeDashoffset = String(GAUGE_CIRCUMFERENCE * (1 - ratio));
  animateNumber($(numId), value);
}

function animateNumber(el, target) {
  const start = Number(el.textContent) || 0;
  if (start === target) { el.textContent = String(target); return; }
  const t0 = performance.now();
  const dur = 600;
  let done = false;
  function step(t) {
    const k = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(start + (target - start) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
    else done = true;
  }
  requestAnimationFrame(step);
  // Guarantee the final value even if requestAnimationFrame is throttled
  // (e.g. background tab), so a metric never gets stuck mid-animation.
  setTimeout(() => { if (!done) el.textContent = String(target); }, dur + 120);
}

// Dispatch history
async function loadHistory() {
  const plans = await api.listDispatchPlans(state.incident.id);
  const ul = $("history");
  ul.innerHTML = "";
  if (!plans.length) {
    ul.innerHTML = `<li class="history-empty">No committed dispatches yet. Press “Commit dispatch” to save a snapshot.</li>`;
    return;
  }
  plans.forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="h-score">${p.impact_score}</span>
      <span class="h-zone">${escapeHtml(p.top_zone_name)} <span class="q-tag">${p.top_need}</span></span>
      <span class="h-time">${formatTime(p.created_at)}</span>
      <span class="muted">cov ${p.coverage} · risk ${p.residual_risk}</span>`;
    ul.appendChild(li);
  });
}

async function commitDispatch() {
  try {
    const plan = await api.commitDispatch(state.incident.id);
    await loadHistory();
    await refreshStatus();
    toast(`Dispatch committed · ${plan.top_zone_name}`);
  } catch (e) { toast(e.message, "err"); }
}

// Incident lifecycle
async function loadIncident(id) {
  state.incident = await api.getIncident(id);
  renderIncidentForm(state.incident);
  renderZones(state.incident);
  await refreshRanking();
  await loadHistory();
}

async function reloadCurrent() {
  const id = state.incident.id;
  state.incident = await api.getIncident(id);
  renderZones(state.incident);
  await refreshRanking();
}

async function deleteCurrentIncident() {
  if (state.incidents.length <= 1) { toast("Keep at least one incident.", "err"); return; }
  if (!confirm(`Delete incident “${state.incident.name}”? This also removes its zones and saved dispatches.`)) return;
  try {
    await api.deleteIncident(state.incident.id);
    state.incident = null;
    await refreshIncidents();
    await loadIncident(state.incidents[0].id);
    await refreshStatus();
    toast("Incident deleted");
  } catch (e) { toast(e.message, "err"); }
}

// Misc utils
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function fmtInt(n) { return Number(n || 0).toLocaleString(); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
function formatTime(iso) {
  const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Onboarding
const OB_KEY = "reliefgrid_onboarded_v1";
function showOnboarding() { const m = $("onboarding"); if (m) m.hidden = false; }
function dismissOnboarding() {
  const m = $("onboarding"); if (m) m.hidden = true;
  try { localStorage.setItem(OB_KEY, "1"); } catch { /* private mode */ }
}
function maybeShowOnboarding() {
  let seen = false;
  try { seen = !!localStorage.getItem(OB_KEY); } catch { /* private mode */ }
  if (!seen) showOnboarding();
}

// Guided step rail (active-section tracking)
function initStepRail() {
  const steps = [...document.querySelectorAll(".steprail .step")];
  const setActive = (id) => steps.forEach((s) => s.classList.toggle("active", s.dataset.step === id));
  setActive("step-setup");
  const targets = ["step-setup", "step-review", "step-commit"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!("IntersectionObserver" in window) || !targets.length) return;
  const io = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible[0]) setActive(visible[0].target.id);
  }, { rootMargin: "-28% 0px -55% 0px", threshold: [0, 0.25, 0.6] });
  targets.forEach((t) => io.observe(t));
}

// Wiring
function wireEvents() {
  $("incidentSelect").addEventListener("change", (e) => loadIncident(Number(e.target.value)));
  $("deleteIncident").addEventListener("click", deleteCurrentIncident);
  $("addZone").addEventListener("click", () => toggleLocSearch());
  $("placeSearchBtn").addEventListener("click", searchPlaces);
  $("placeInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); searchPlaces(); } });
  $("commitDispatch").addEventListener("click", commitDispatch);

  // Onboarding / "How it works"
  $("howItWorks").addEventListener("click", showOnboarding);
  $("obClose").addEventListener("click", dismissOnboarding);
  $("obStart").addEventListener("click", dismissOnboarding);
  $("onboarding").addEventListener("click", (e) => { if (e.target.id === "onboarding") dismissOnboarding(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("onboarding").hidden) dismissOnboarding();
  });

  $("incidentName").addEventListener("input", debounce(() => {
    const v = $("incidentName").value.trim();
    if (!v) return;
    state.incident.name = v;
    patchIncident({ name: v });
    refreshIncidents();
  }, 350));

  $("timeWindow").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    setSegmented("timeWindow", b.dataset.value);
    state.incident.time_window = Number(b.dataset.value);
    patchIncident({ time_window: Number(b.dataset.value) });
  });
  $("transportMode").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    setSegmented("transportMode", b.dataset.value);
    state.incident.transport_mode = b.dataset.value;
    patchIncident({ transport_mode: b.dataset.value });
  });

  $("copyBrief").addEventListener("click", async () => {
    if (!state.ranking) return;
    const ok = await copyText(state.ranking.brief_text);
    toast(ok ? "Brief copied to clipboard" : "Copy blocked - use Export PNG", ok ? "ok" : "err");
  });

  $("exportReceipt").addEventListener("click", () => {
    if (!state.ranking || !state.ranking.ranked.length) { toast("Nothing to export yet.", "err"); return; }
    const url = buildReceiptDataUrl({
      incidentName: state.ranking.incident_name,
      ranked: state.ranking.ranked,
      metrics: state.ranking.metrics,
      action_plan: state.ranking.action_plan,
    });
    $("receiptImg").src = url;
    $("downloadReceipt").href = url;
    $("receiptPanel").hidden = false;
    $("receiptPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
    toast("Receipt ready - download below");
  });
}

// Boot
async function boot() {
  wireEvents();
  initStepRail();
  maybeShowOnboarding();
  await refreshStatus();
  try {
    state.templates = await api.templates();
    renderTemplates();
    await refreshIncidents();
    if (!state.incidents.length) {
      await api.createFromTemplate("heatwave");
      await refreshIncidents();
    }
    await loadIncident(state.incidents[0].id);
  } catch (e) {
    toast("Failed to reach backend: " + e.message, "err", 5000);
    console.error(e);
  }
}

boot();
