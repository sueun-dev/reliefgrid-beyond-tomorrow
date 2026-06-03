// Render a shareable "dispatch brief" PNG from the current ranking.
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((t, i) => ctx.fillText(t, x, y + i * lineHeight));
  return Math.min(lines.length, maxLines) * lineHeight;
}

export function buildReceiptDataUrl(data) {
  const { incidentName, ranked, metrics, action_plan } = data;
  const top = ranked[0];
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 820;
  const ctx = canvas.getContext("2d");

  // Backdrop
  const bg = ctx.createLinearGradient(0, 0, 1200, 820);
  bg.addColorStop(0, "#070b14");
  bg.addColorStop(1, "#0c1426");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 820);

  // Card
  ctx.fillStyle = "#0f1830";
  roundRect(ctx, 40, 40, 1120, 740, 28); ctx.fill();
  ctx.strokeStyle = "rgba(245,181,63,0.4)"; ctx.lineWidth = 2;
  roundRect(ctx, 40, 40, 1120, 740, 28); ctx.stroke();

  // Header
  ctx.fillStyle = "#f5b53f";
  ctx.font = "800 22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("RELIEFGRID · DISPATCH BRIEF", 80, 104);
  ctx.fillStyle = "#93a2bd";
  ctx.font = "600 17px ui-sans-serif, system-ui, sans-serif";
  wrapText(ctx, incidentName, 80, 138, 900, 24, 1);

  // Top zone
  ctx.fillStyle = "#eaf0fb";
  ctx.font = "800 58px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(top.name, 80, 220);
  ctx.fillStyle = "#34d399";
  ctx.font = "700 24px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`Send ${String(top.need).toLowerCase()} support first`, 82, 262);

  // Big score
  ctx.fillStyle = "#f5b53f";
  ctx.font = "800 110px ui-monospace, monospace";
  ctx.fillText(String(top.score), 80, 386);
  ctx.fillStyle = "#93a2bd";
  ctx.font = "700 20px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("PRIORITY SCORE", 86, 418);

  // Metric chips
  const chips = [
    ["Impact", metrics.impact, "#f5b53f"],
    ["Coverage", metrics.coverage, "#34d399"],
    ["Residual risk", metrics.residual_risk, "#fb7185"],
  ];
  let cx = 560;
  chips.forEach(([label, value, color]) => {
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    roundRect(ctx, cx, 300, 180, 110, 16); ctx.fill();
    ctx.fillStyle = color;
    ctx.font = "800 44px ui-monospace, monospace";
    ctx.fillText(String(value), cx + 20, 362);
    ctx.fillStyle = "#93a2bd";
    ctx.font = "600 15px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(label, cx + 20, 392);
    cx += 200;
  });

  // Action plan
  ctx.fillStyle = "#6aa5ff";
  ctx.font = "700 18px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("FIRST-HOUR ACTION PLAN", 80, 478);
  ctx.fillStyle = "#d6def0";
  ctx.font = "600 19px ui-sans-serif, system-ui, sans-serif";
  let y = 514;
  (action_plan || []).forEach((line, i) => {
    y += wrapText(ctx, `${i + 1}.  ${line}`, 80, y, 1040, 27, 2) + 12;
  });

  // Footer
  ctx.fillStyle = "#66758f";
  ctx.font = "600 16px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Transparent priority scoring · local-first · no account required · Beyond Tomorrow Summit", 80, 742);

  return canvas.toDataURL("image/png");
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
