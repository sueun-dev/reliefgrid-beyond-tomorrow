// Canvas "response map": relief hub at center, ranked routes fanning out.
const PALETTE = {
  bg: "#0a1120",
  grid: "rgba(148, 173, 214, 0.08)",
  hub: "#ffffff",
  gold: "#f5b53f",
  green: "#34d399",
  blue: "#6aa5ff",
  text: "#eaf0fb",
  muted: "#93a2bd",
};

function setupHiDPI(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = 900, h = 500;
  if (canvas.width !== w * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

export function drawMap(canvas, ranked) {
  const { ctx, w, h } = setupHiDPI(canvas);
  ctx.clearRect(0, 0, w, h);

  // Background + vignette
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#0b1424");
  bg.addColorStop(1, "#080e1a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = PALETTE.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 45) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += 45) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  const hub = { x: w * 0.5, y: h * 0.5 };

  if (!ranked || ranked.length === 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = "600 16px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Add a response zone to see the dispatch map.", w / 2, h / 2);
    ctx.textAlign = "left";
    return;
  }

  // Routes (draw behind nodes)
  ranked.forEach((zone, i) => {
    const x = zone.x * w, y = zone.y * h;
    const grad = ctx.createLinearGradient(hub.x, hub.y, x, y);
    if (i === 0) { grad.addColorStop(0, "rgba(245,181,63,0.15)"); grad.addColorStop(1, PALETTE.gold); }
    else { grad.addColorStop(0, "rgba(106,165,255,0.08)"); grad.addColorStop(1, "rgba(106,165,255,0.4)"); }
    ctx.strokeStyle = grad;
    ctx.lineWidth = i === 0 ? 4 : 1.6;
    ctx.setLineDash(i === 0 ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(hub.x, hub.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Hub
  ctx.save();
  ctx.shadowColor = "rgba(255,255,255,0.5)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = PALETTE.hub;
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = PALETTE.text;
  ctx.font = "700 13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Relief hub", hub.x + 16, hub.y + 4);

  // Zone nodes
  ranked.forEach((zone, i) => {
    const x = zone.x * w, y = zone.y * h;
    const color = i === 0 ? PALETTE.gold : i === 1 ? PALETTE.green : PALETTE.blue;

    if (i === 0) {
      ctx.save();
      ctx.shadowColor = "rgba(245,181,63,0.6)";
      ctx.shadowBlur = 22;
      ctx.fillStyle = "rgba(245,181,63,0.18)";
      ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#0a1120"; ctx.lineWidth = 3; ctx.stroke();

    ctx.fillStyle = "#0a1120";
    ctx.font = "800 13px ui-monospace, monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), x, y + 0.5);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";

    // Label
    ctx.fillStyle = PALETTE.text;
    ctx.font = "700 14px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(zone.name, x + 24, y - 2);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(`Score ${zone.score} · ${zone.need}`, x + 24, y + 15);
  });
}
