const scenarios = {
  heat: {
    incidentName: "48-hour heatwave and grid stress",
    timeWindow: "12",
    transportMode: "van",
    resources: { waterKits: 68, medicalKits: 24, coolingUnits: 11, fieldTeams: 5 },
    zones: [
      { name: "Northside Towers", need: "Cooling", residents: 420, vulnerable: 78, severity: 92, distance: 18, comms: 35, x: 0.72, y: 0.22 },
      { name: "East Clinic", need: "Medical", residents: 180, vulnerable: 64, severity: 84, distance: 10, comms: 72, x: 0.65, y: 0.58 },
      { name: "River School", need: "Water", residents: 310, vulnerable: 42, severity: 74, distance: 24, comms: 56, x: 0.31, y: 0.32 },
      { name: "Market Block", need: "Water", residents: 520, vulnerable: 28, severity: 68, distance: 14, comms: 62, x: 0.44, y: 0.72 },
    ],
  },
  flood: {
    incidentName: "Overnight flood and blocked supply roads",
    timeWindow: "6",
    transportMode: "mixed",
    resources: { waterKits: 52, medicalKits: 31, coolingUnits: 4, fieldTeams: 6 },
    zones: [
      { name: "Lowbank Homes", need: "Medical", residents: 260, vulnerable: 68, severity: 90, distance: 12, comms: 28, x: 0.26, y: 0.68 },
      { name: "Bridge Shelter", need: "Water", residents: 610, vulnerable: 51, severity: 86, distance: 17, comms: 44, x: 0.52, y: 0.36 },
      { name: "West Pump", need: "Power", residents: 190, vulnerable: 34, severity: 78, distance: 26, comms: 60, x: 0.78, y: 0.64 },
      { name: "Clinic Annex", need: "Medical", residents: 120, vulnerable: 73, severity: 82, distance: 9, comms: 80, x: 0.35, y: 0.22 },
    ],
  },
};

let zones = structuredClone(scenarios.heat.zones);

const fields = {
  incidentName: document.querySelector("#incidentName"),
  timeWindow: document.querySelector("#timeWindow"),
  transportMode: document.querySelector("#transportMode"),
  waterKits: document.querySelector("#waterKits"),
  medicalKits: document.querySelector("#medicalKits"),
  coolingUnits: document.querySelector("#coolingUnits"),
  fieldTeams: document.querySelector("#fieldTeams"),
};

const els = {
  zoneList: document.querySelector("#zoneList"),
  mapCanvas: document.querySelector("#mapCanvas"),
  topMissionTitle: document.querySelector("#topMissionTitle"),
  topMissionText: document.querySelector("#topMissionText"),
  impactScore: document.querySelector("#impactScore"),
  coverageScore: document.querySelector("#coverageScore"),
  riskScore: document.querySelector("#riskScore"),
  actionPlan: document.querySelector("#actionPlan"),
  saveNote: document.querySelector("#saveNote"),
  receiptPanel: document.querySelector("#receiptExportPanel"),
  receiptPreview: document.querySelector("#receiptPreview"),
  downloadReceipt: document.querySelector("#downloadReceipt"),
};

const allowedTimeWindows = new Set(["6", "12", "24"]);
const allowedTransportModes = new Set(["bike", "van", "mixed"]);

function numberValue(id) {
  return Number(fields[id].value || 0);
}

function currentResources() {
  return {
    waterKits: numberValue("waterKits"),
    medicalKits: numberValue("medicalKits"),
    coolingUnits: numberValue("coolingUnits"),
    fieldTeams: numberValue("fieldTeams"),
  };
}

function resourceFit(zone, resources = currentResources()) {
  if (zone.need === "Water") return Math.min(100, resources.waterKits / Math.max(1, zone.residents / 8) * 100);
  if (zone.need === "Medical") return Math.min(100, resources.medicalKits / Math.max(1, zone.vulnerable / 4) * 100);
  if (zone.need === "Cooling") return Math.min(100, resources.coolingUnits / Math.max(1, zone.vulnerable / 10) * 100);
  return Math.min(100, (resources.medicalKits + resources.waterKits) / Math.max(1, zone.residents / 10) * 100);
}

function transportPenalty(zone) {
  const mode = fields.transportMode.value;
  const modeFactor = mode === "bike" ? 1.2 : mode === "mixed" ? 0.85 : 0.65;
  return zone.distance * modeFactor;
}

function scoreZone(zone) {
  const timePressure = Number(fields.timeWindow.value) <= 6 ? 1.12 : Number(fields.timeWindow.value) >= 24 ? 0.92 : 1;
  const exposure = zone.severity * 0.44 + zone.vulnerable * 0.28 + Math.min(100, zone.residents / 7) * 0.18;
  const signalRisk = (100 - zone.comms) * 0.18;
  const fit = resourceFit(zone) * 0.2;
  const score = (exposure + signalRisk + fit - transportPenalty(zone)) * timePressure;
  return Math.max(0, Math.round(score));
}

function rankedZones() {
  return zones.map((zone) => ({ ...zone, score: scoreZone(zone), fit: Math.round(resourceFit(zone)) })).sort((a, b) => b.score - a.score);
}

function renderZones() {
  els.zoneList.innerHTML = "";
  zones.forEach((zone, index) => {
    const card = document.createElement("div");
    card.className = "zone-card";

    const title = document.createElement("div");
    title.className = "zone-title";
    const name = document.createElement("strong");
    name.textContent = zone.name;
    const need = document.createElement("span");
    need.textContent = `${zone.need} need`;
    title.append(name, need);
    card.appendChild(title);

    [
      ["Severity", "severity", 0, 100],
      ["Vulnerable", "vulnerable", 0, 100],
      ["Residents", "residents", 0, 1000],
      ["Comms", "comms", 0, 100],
    ].forEach(([labelText, key, min, max]) => {
      const label = document.createElement("label");
      label.textContent = labelText;
      const input = document.createElement("input");
      input.type = "number";
      input.min = String(min);
      input.max = String(max);
      input.value = String(zone[key]);
      input.dataset.zone = String(index);
      input.dataset.key = key;
      label.appendChild(input);
      card.appendChild(label);
    });

    els.zoneList.appendChild(card);
  });
}

function makeActionPlan(top, ranked) {
  const second = ranked[1];
  const resources = currentResources();
  return [
    `Dispatch ${Math.max(1, Math.ceil(resources.fieldTeams / 2))} field teams to ${top.name} with ${top.need.toLowerCase()} supplies.`,
    `Reserve one team for ${second.name}; it is the next-highest risk zone at score ${second.score}.`,
    `Send a confirmation runner if comms are below 50; ${top.name} comms are at ${top.comms}.`,
    `Fallback: if ${top.need.toLowerCase()} stock runs short, split delivery by vulnerable residents first.`,
  ];
}

function hideReceiptExport() {
  els.receiptPanel.hidden = true;
  els.receiptPreview.removeAttribute("src");
  els.downloadReceipt.removeAttribute("href");
}

function updateOutput() {
  hideReceiptExport();
  const ranked = rankedZones();
  const top = ranked[0];
  const averageCoverage = Math.round(ranked.reduce((sum, zone) => sum + zone.fit, 0) / ranked.length);
  const residualRisk = Math.max(0, Math.round(100 - averageCoverage * 0.45 - Number(fields.fieldTeams.value) * 4));

  els.topMissionTitle.textContent = `Send ${top.need.toLowerCase()} support to ${top.name} first.`;
  els.topMissionText.textContent = `${top.name} has the strongest combined signal: severity ${top.severity}, ${top.vulnerable}% vulnerable residents, ${top.distance} km travel, and ${top.comms}% comms reliability.`;
  els.impactScore.textContent = top.score;
  els.coverageScore.textContent = averageCoverage;
  els.riskScore.textContent = residualRisk;

  els.actionPlan.innerHTML = "";
  makeActionPlan(top, ranked).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    els.actionPlan.appendChild(li);
  });

  drawMap(ranked);
}

function drawMap(ranked = rankedZones(), canvas = els.mapCanvas) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#13201d";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 250, 240, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 38) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 38) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const hub = { x: width * 0.5, y: height * 0.5 };
  ctx.fillStyle = "#fffaf0";
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "900 18px Avenir Next, sans-serif";
  ctx.fillText("Relief hub", hub.x + 16, hub.y + 6);

  ranked.forEach((zone, index) => {
    const x = zone.x * width;
    const y = zone.y * height;
    ctx.strokeStyle = index === 0 ? "#f6c84f" : "rgba(255, 250, 240, 0.34)";
    ctx.lineWidth = index === 0 ? 5 : 2;
    ctx.beginPath();
    ctx.moveTo(hub.x, hub.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = index === 0 ? "#f6c84f" : index === 1 ? "#bbf7d0" : "#8fb6ff";
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fffaf0";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#fffaf0";
    ctx.font = "900 18px Avenir Next, sans-serif";
    ctx.fillText(`${index + 1}. ${zone.name}`, x + 24, y - 4);
    ctx.fillStyle = "#bbf7d0";
    ctx.font = "800 14px Avenir Next, sans-serif";
    ctx.fillText(`Score ${zone.score} | ${zone.need}`, x + 24, y + 18);
  });
}

function buildBriefText() {
  const ranked = rankedZones();
  const top = ranked[0];
  return [
    `ReliefGrid dispatch brief: ${fields.incidentName.value}`,
    `Top mission: send ${top.need.toLowerCase()} support to ${top.name}.`,
    `Why: score ${top.score}, severity ${top.severity}, vulnerable ${top.vulnerable}%, comms ${top.comms}%, distance ${top.distance} km.`,
    `First hour: ${makeActionPlan(top, ranked).join(" ")}`,
  ].join("\n");
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy selection path when browser permissions block Clipboard API.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.left = "-1000px";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

function drawWrappedCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((lineText, index) => {
    ctx.fillText(lineText, x, y + index * lineHeight);
  });
  return Math.min(lines.length, maxLines) * lineHeight;
}

function buildReceiptCanvas() {
  const ranked = rankedZones();
  const top = ranked[0];
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 780;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4f1e8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#15201d";
  ctx.fillRect(42, 42, 1116, 684);
  ctx.fillStyle = "#bbf7d0";
  ctx.font = "900 22px Avenir Next, sans-serif";
  ctx.fillText("RELIEFGRID DISPATCH BRIEF", 78, 96);
  ctx.fillStyle = "#fffaf0";
  ctx.font = "900 68px Iowan Old Style, Georgia, serif";
  ctx.fillText(top.name, 78, 166);
  ctx.font = "900 28px Avenir Next, sans-serif";
  ctx.fillText(`Send ${top.need.toLowerCase()} support first`, 80, 216);
  ctx.fillStyle = "#f6c84f";
  ctx.font = "900 100px Iowan Old Style, Georgia, serif";
  ctx.fillText(String(top.score), 78, 350);
  ctx.fillStyle = "#bbf7d0";
  ctx.font = "900 20px Avenir Next, sans-serif";
  ctx.fillText("priority score", 84, 382);
  ctx.fillStyle = "#fffaf0";
  ctx.font = "800 21px Avenir Next, sans-serif";
  const lines = makeActionPlan(top, ranked);
  let y = 456;
  lines.forEach((line, index) => {
    y += drawWrappedCanvasText(ctx, `${index + 1}. ${line}`, 78, y, 1040, 29, 2) + 10;
  });
  ctx.fillStyle = "#8fb6ff";
  ctx.font = "900 22px Avenir Next, sans-serif";
  ctx.fillText("Local-first prototype | no account required | Beyond Tomorrow Summit", 78, 682);
  return canvas;
}

function exportReceiptDataUrl() {
  return buildReceiptCanvas().toDataURL("image/png");
}

function exportReceipt() {
  const dataUrl = exportReceiptDataUrl();
  els.receiptPreview.src = dataUrl;
  els.downloadReceipt.href = dataUrl;
  els.receiptPanel.hidden = false;
}

function normalizeNumber(value, fallback, min = 0, max = Number.POSITIVE_INFINITY) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function applyPlan(plan) {
  if (!plan || !Array.isArray(plan.zones) || plan.zones.length < 2) return false;

  fields.incidentName.value = typeof plan.incidentName === "string" && plan.incidentName.trim()
    ? plan.incidentName.trim()
    : scenarios.heat.incidentName;
  fields.timeWindow.value = allowedTimeWindows.has(String(plan.timeWindow)) ? String(plan.timeWindow) : scenarios.heat.timeWindow;
  fields.transportMode.value = allowedTransportModes.has(String(plan.transportMode)) ? String(plan.transportMode) : scenarios.heat.transportMode;

  const savedResources = plan.resources || {};
  fields.waterKits.value = normalizeNumber(savedResources.waterKits, scenarios.heat.resources.waterKits, 0, 160);
  fields.medicalKits.value = normalizeNumber(savedResources.medicalKits, scenarios.heat.resources.medicalKits, 0, 80);
  fields.coolingUnits.value = normalizeNumber(savedResources.coolingUnits, scenarios.heat.resources.coolingUnits, 0, 40);
  fields.fieldTeams.value = normalizeNumber(savedResources.fieldTeams, scenarios.heat.resources.fieldTeams, 1, 20);

  zones = plan.zones.map((zone, index) => {
    const fallback = scenarios.heat.zones[index % scenarios.heat.zones.length];
    return {
      name: typeof zone.name === "string" && zone.name.trim() ? zone.name.trim() : fallback.name,
      need: typeof zone.need === "string" && zone.need.trim() ? zone.need.trim() : fallback.need,
      residents: normalizeNumber(zone.residents, fallback.residents, 0, 1000),
      vulnerable: normalizeNumber(zone.vulnerable, fallback.vulnerable, 0, 100),
      severity: normalizeNumber(zone.severity, fallback.severity, 0, 100),
      distance: normalizeNumber(zone.distance, fallback.distance, 0, 80),
      comms: normalizeNumber(zone.comms, fallback.comms, 0, 100),
      x: normalizeNumber(zone.x, fallback.x, 0.05, 0.95),
      y: normalizeNumber(zone.y, fallback.y, 0.05, 0.95),
    };
  });

  renderZones();
  updateOutput();
  els.saveNote.textContent = "Loaded saved local plan.";
  return true;
}

function loadSavedPlan() {
  try {
    const saved = localStorage.getItem("reliefgrid-plan");
    if (!saved) return false;
    return applyPlan(JSON.parse(saved));
  } catch {
    localStorage.removeItem("reliefgrid-plan");
    return false;
  }
}

function savePlan() {
  localStorage.setItem(
    "reliefgrid-plan",
    JSON.stringify({
      incidentName: fields.incidentName.value,
      timeWindow: fields.timeWindow.value,
      transportMode: fields.transportMode.value,
      resources: currentResources(),
      zones,
    }),
  );
  els.saveNote.textContent = `Saved locally at ${new Date().toLocaleTimeString()}.`;
}

function loadScenario(key) {
  const scenario = scenarios[key];
  fields.incidentName.value = scenario.incidentName;
  fields.timeWindow.value = scenario.timeWindow;
  fields.transportMode.value = scenario.transportMode;
  Object.entries(scenario.resources).forEach(([field, value]) => {
    fields[field].value = value;
  });
  zones = structuredClone(scenario.zones);
  renderZones();
  updateOutput();
  els.saveNote.textContent = `${key === "flood" ? "Flood" : "Heatwave"} scenario loaded.`;
}

function resetPlan() {
  localStorage.removeItem("reliefgrid-plan");
  loadScenario("heat");
  els.saveNote.textContent = "Reset to the default heatwave scenario.";
}

function attachEvents() {
  document.querySelector("#loadHeat").addEventListener("click", () => loadScenario("heat"));
  document.querySelector("#loadFlood").addEventListener("click", () => loadScenario("flood"));
  document.querySelector("#recalculate").addEventListener("click", updateOutput);
  document.querySelector("#savePlan").addEventListener("click", savePlan);
  document.querySelector("#resetPlan").addEventListener("click", resetPlan);
  document.querySelector("#exportBrief").addEventListener("click", exportReceipt);
  document.querySelector("#copyBrief").addEventListener("click", async () => {
    const copied = await copyText(buildBriefText());
    els.saveNote.textContent = copied ? "Brief copied to clipboard." : "Clipboard blocked. Use Export PNG for handoff.";
  });
  Object.values(fields).forEach((field) => field.addEventListener("input", updateOutput));
  els.zoneList.addEventListener("input", (event) => {
    const target = event.target;
    if (!target.dataset.zone) return;
    zones[Number(target.dataset.zone)][target.dataset.key] = Number(target.value);
    updateOutput();
  });
}

attachEvents();
if (!loadSavedPlan()) {
  renderZones();
  updateOutput();
}

window.ReliefGrid = {
  rankedZones,
  scoreZone,
  buildReceiptCanvas,
  exportReceiptDataUrl,
  loadScenario,
  loadSavedPlan,
};
