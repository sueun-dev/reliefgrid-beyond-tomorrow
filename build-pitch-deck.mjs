import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const pptxgen = require("/Users/sueuncho/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Sueun Cho";
pptx.company = "ReliefGrid";
pptx.subject = "Beyond Tomorrow Summit submission pitch deck";
pptx.title = "ReliefGrid Pitch Deck";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};

const W = 13.333;
const H = 7.5;
const C = {
  ink: "111827",
  ink2: "1F2937",
  muted: "6B7280",
  line: "D8DEE9",
  paper: "F7F8FA",
  white: "FFFFFF",
  blue: "2563EB",
  cyan: "0891B2",
  green: "059669",
  amber: "D97706",
  coral: "E11D48",
  lilac: "7C3AED",
  paleBlue: "EAF2FF",
  paleGreen: "EAF7F0",
  paleAmber: "FFF5E6",
  paleCoral: "FFF1F2",
};

function exists(path) {
  if (!fs.existsSync(path)) throw new Error(`Missing required deck asset: ${path}`);
  return path;
}

const assets = {
  main: exists("reliefgrid-main.png"),
  brief: exists("reliefgrid-brief.png"),
  mobile: exists("reliefgrid-mobile.png"),
};

function addBg(slide, color = C.paper) {
  slide.background = { color };
}

function text(slide, value, x, y, w, h, opts = {}) {
  slide.addText(value, {
    x,
    y,
    w,
    h,
    margin: opts.margin ?? 0.02,
    fontFace: opts.fontFace ?? "Aptos",
    fontSize: opts.fontSize ?? 16,
    bold: opts.bold ?? false,
    color: opts.color ?? C.ink,
    breakLine: opts.breakLine ?? false,
    fit: "shrink",
    valign: opts.valign ?? "top",
    align: opts.align ?? "left",
    paraSpaceAfterPt: opts.paraSpaceAfterPt ?? 0,
    paraSpaceBeforePt: opts.paraSpaceBeforePt ?? 0,
    lineSpacingMultiple: opts.lineSpacingMultiple ?? 0.9,
    ...opts.extra,
  });
}

function claim(slide, kicker, title, sub = "", dark = false) {
  text(slide, kicker.toUpperCase(), 0.62, 0.44, 4.4, 0.24, {
    fontSize: 8.5,
    bold: true,
    color: dark ? "BFE6D3" : C.green,
    extra: { charSpace: 0.6 },
  });
  text(slide, title, 0.62, 0.72, 7.55, 1.0, {
    fontFace: "Aptos Display",
    fontSize: 30,
    bold: true,
    color: dark ? C.white : C.ink,
    lineSpacingMultiple: 0.82,
  });
  if (sub) {
    text(slide, sub, 0.64, 1.78, 6.95, 0.48, {
      fontSize: 13,
      color: dark ? "D1D5DB" : C.muted,
      lineSpacingMultiple: 0.95,
    });
  }
}

function page(slide, n, dark = false) {
  slide.addShape(pptx.ShapeType.line, {
    x: 0.62,
    y: 7.04,
    w: 11.8,
    h: 0,
    line: { color: dark ? "374151" : C.line, width: 0.6 },
  });
  text(slide, `ReliefGrid / Beyond Tomorrow Summit / ${String(n).padStart(2, "0")}`, 0.62, 7.12, 5.0, 0.18, {
    fontSize: 7.5,
    color: dark ? "9CA3AF" : "8A95A4",
  });
}

function pill(slide, label, x, y, w, color, fill) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 0.33,
    rectRadius: 0.05,
    fill: { color: fill },
    line: { color: "FFFFFF", transparency: 100 },
  });
  text(slide, label, x + 0.12, y + 0.085, w - 0.24, 0.12, {
    fontSize: 8.5,
    bold: true,
    color,
    valign: "mid",
  });
}

function metric(slide, value, label, x, y, color = C.blue, dark = false) {
  text(slide, value, x, y, 1.65, 0.34, {
    fontFace: "Aptos Display",
    fontSize: 19,
    bold: true,
    color: dark ? C.white : color,
  });
  text(slide, label, x, y + 0.38, 1.75, 0.28, {
    fontSize: 8.8,
    color: dark ? "CBD5E1" : C.muted,
    lineSpacingMultiple: 0.85,
  });
}

function callout(slide, label, body, x, y, w, color, fill = C.white) {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.9,
    fill: { color: fill },
    line: { color: C.line, width: 0.5 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.06,
    h: 0.9,
    fill: { color },
    line: { color, transparency: 100 },
  });
  text(slide, label, x + 0.18, y + 0.14, w - 0.3, 0.18, {
    fontSize: 9,
    bold: true,
    color,
  });
  text(slide, body, x + 0.18, y + 0.38, w - 0.32, 0.34, {
    fontSize: 9.5,
    color: C.ink2,
    lineSpacingMultiple: 0.86,
  });
}

function addImageFrame(slide, path, x, y, w, h, border = C.white) {
  slide.addShape(pptx.ShapeType.rect, {
    x: x - 0.04,
    y: y - 0.04,
    w: w + 0.08,
    h: h + 0.08,
    fill: { color: border, transparency: 0 },
    line: { color: C.line, width: 0.4 },
  });
  slide.addImage({ path, x, y, w, h });
}

function bulletList(slide, items, x, y, w, h, color = C.ink2) {
  const runs = items.flatMap((item, index) => [
    { text: `${index + 1}. `, options: { bold: true, color: C.green } },
    { text: item + (index === items.length - 1 ? "" : "\n"), options: { color } },
  ]);
  slide.addText(runs, {
    x,
    y,
    w,
    h,
    fontFace: "Aptos",
    fontSize: 13,
    margin: 0.02,
    fit: "shrink",
    breakLine: false,
    valign: "top",
    lineSpacingMultiple: 0.88,
  });
}

function slide1() {
  const slide = pptx.addSlide();
  addBg(slide, "0E1626");
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: W,
    h: H,
    fill: { color: "0E1626" },
    line: { color: "0E1626" },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.74,
    y: 0.56,
    w: 0.44,
    h: 0,
    line: { color: C.green, width: 2.3 },
  });
  text(slide, "BEYOND TOMORROW SUMMIT", 1.32, 0.47, 3.1, 0.22, {
    fontSize: 8,
    bold: true,
    color: "BFE6D3",
    extra: { charSpace: 0.7 },
  });
  text(slide, "ReliefGrid", 0.72, 1.05, 4.9, 0.62, {
    fontFace: "Aptos Display",
    fontSize: 42,
    bold: true,
    color: C.white,
  });
  text(slide, "Prioritize response before the crisis spreads.", 0.76, 1.82, 4.85, 0.62, {
    fontSize: 18,
    color: "D1D5DB",
    lineSpacingMultiple: 0.86,
  });
  text(
    slide,
    "A working local-first app for community response teams that turns noisy field reports into a ranked dispatch brief.",
    0.76,
    2.78,
    4.9,
    0.86,
    { fontSize: 14, color: "B8C4D4", lineSpacingMultiple: 0.92 },
  );
  metric(slide, "93", "Top-zone dispatch score", 0.78, 4.32, C.green, true);
  metric(slide, "4", "Inputs ranked per zone", 2.55, 4.32, C.cyan, true);
  metric(slide, "1 hr", "Plan generated for field teams", 4.32, 4.32, C.amber, true);
  addImageFrame(slide, assets.main, 6.2, 0.76, 6.2, 4.36, "1A2436");
  slide.addShape(pptx.ShapeType.line, {
    x: 6.18,
    y: 5.58,
    w: 6.25,
    h: 0,
    line: { color: "2F3B52", width: 0.7 },
  });
  text(slide, "Deliverables ready: working app, demo video, screenshots, pitch deck, Devpost field copy.", 6.2, 5.78, 6.2, 0.42, {
    fontSize: 12,
    color: "D1D5DB",
  });
  page(slide, 1, true);
}

function slide2() {
  const slide = pptx.addSlide();
  addBg(slide);
  claim(
    slide,
    "Problem",
    "Emergency teams lose time when every zone looks urgent.",
    "The product is intentionally narrow: make the first prioritization call explainable, shareable, and fast.",
  );
  const lanes = [
    ["Resident reports", C.blue, C.paleBlue, "High volume, uneven confidence, hard to compare."],
    ["Supply limits", C.amber, C.paleAmber, "Water, transport, and volunteers run out before need does."],
    ["Fragile comms", C.coral, C.paleCoral, "A perfect cloud dashboard fails when field teams are offline."],
  ];
  lanes.forEach(([label, color, fill, body], i) => {
    const y = 2.55 + i * 1.15;
    slide.addShape(pptx.ShapeType.line, { x: 1.25, y: y + 0.42, w: 9.6, h: 0, line: { color: C.line, width: 0.8 } });
    slide.addShape(pptx.ShapeType.ellipse, { x: 1.0, y: y + 0.2, w: 0.45, h: 0.45, fill: { color }, line: { color } });
    text(slide, label, 1.75, y + 0.08, 2.4, 0.24, { fontSize: 13, bold: true, color });
    text(slide, body, 4.32, y + 0.06, 4.4, 0.34, { fontSize: 12, color: C.ink2, lineSpacingMultiple: 0.88 });
    pill(slide, i === 0 ? "signal" : i === 1 ? "constraint" : "failure mode", 9.35, y + 0.19, 1.4, color, fill);
  });
  callout(slide, "Design target", "A responder should understand why the top zone wins without opening a model explanation page.", 8.95, 1.12, 3.25, C.green, C.white);
  callout(slide, "Submission fit", "Impact, implementation, UX, and innovation are each explicit in the prototype.", 8.95, 5.55, 3.25, C.lilac, C.white);
  page(slide, 2);
}

function slide3() {
  const slide = pptx.addSlide();
  addBg(slide, "F4F7FB");
  claim(
    slide,
    "Workflow",
    "ReliefGrid compresses a messy incident into one dispatch decision.",
    "The app is built around the moment before action: rank, justify, export.",
  );
  const steps = [
    ["1", "Incident setup", "Adjust supply, comms, transport, and crew constraints."],
    ["2", "Zone scoring", "Rank need, vulnerability, access, and confidence."],
    ["3", "Response map", "See the priority pattern and bottleneck type."],
    ["4", "Dispatch brief", "Export a concrete first-hour action plan."],
  ];
  steps.forEach(([n, label, body], i) => {
    const x = 0.8 + i * 3.1;
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: 2.75,
      w: 2.48,
      h: 2.0,
      fill: { color: C.white },
      line: { color: C.line, width: 0.55 },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.22,
      y: 3.05,
      w: 0.48,
      h: 0.48,
      fill: { color: [C.green, C.blue, C.amber, C.coral][i] },
      line: { color: [C.green, C.blue, C.amber, C.coral][i] },
    });
    text(slide, n, x + 0.38, 3.17, 0.14, 0.11, { fontSize: 8, bold: true, color: C.white, align: "center" });
    text(slide, label, x + 0.24, 3.78, 1.9, 0.24, { fontSize: 12.5, bold: true, color: C.ink });
    text(slide, body, x + 0.24, 4.18, 2.02, 0.48, { fontSize: 10, color: C.ink2, lineSpacingMultiple: 0.86 });
    if (i < steps.length - 1) {
      slide.addShape(pptx.ShapeType.chevron, {
        x: x + 2.62,
        y: 3.54,
        w: 0.34,
        h: 0.38,
        fill: { color: "C9D6E5" },
        line: { color: "C9D6E5" },
      });
    }
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.85,
    y: 5.54,
    w: 11.35,
    h: 0.64,
    fill: { color: "E9F2FF" },
    line: { color: "C8DCF7", width: 0.45 },
  });
  text(slide, "Outcome", 1.08, 5.75, 1.0, 0.16, { fontSize: 9, bold: true, color: C.blue });
  text(slide, "A ranked zone, a reason code, resource guidance, and a brief that can be handed off without an account.", 2.05, 5.72, 8.75, 0.2, {
    fontSize: 11,
    color: C.ink2,
  });
  page(slide, 3);
}

function slide4() {
  const slide = pptx.addSlide();
  addBg(slide);
  claim(
    slide,
    "Prototype",
    "The working build favors visible reasoning over hidden automation.",
    "Every score can be inspected through the same UI judges will use in the demo.",
  );
  addImageFrame(slide, assets.main, 0.76, 2.24, 7.4, 5.2);
  callout(slide, "Editable constraints", "Supply and transport pressure visibly change ranking priorities.", 8.8, 2.12, 3.45, C.blue, C.paleBlue);
  callout(slide, "Ranked zones", "Each zone shows need, vulnerability, access, confidence, score, and action.", 8.8, 3.34, 3.45, C.green, C.paleGreen);
  callout(slide, "Brief export", "The top-zone recommendation becomes a screenshot-ready dispatch receipt.", 8.8, 4.56, 3.45, C.coral, C.paleCoral);
  slide.addShape(pptx.ShapeType.line, { x: 8.25, y: 2.74, w: 0.48, h: 0, line: { color: C.blue, width: 1.3, beginArrowType: "none", endArrowType: "triangle" } });
  slide.addShape(pptx.ShapeType.line, { x: 8.25, y: 3.95, w: 0.48, h: 0, line: { color: C.green, width: 1.3, beginArrowType: "none", endArrowType: "triangle" } });
  slide.addShape(pptx.ShapeType.line, { x: 8.25, y: 5.18, w: 0.48, h: 0, line: { color: C.coral, width: 1.3, beginArrowType: "none", endArrowType: "triangle" } });
  page(slide, 4);
}

function slide5() {
  const slide = pptx.addSlide();
  addBg(slide, "FAFAF7");
  claim(
    slide,
    "Impact",
    "The first version is small enough to use, but broad enough to scale.",
    "ReliefGrid avoids a fragile all-in-one emergency platform and starts with a repeatable decision unit.",
  );
  addImageFrame(slide, assets.brief, 7.05, 1.15, 4.65, 3.02);
  addImageFrame(slide, assets.mobile, 10.65, 4.25, 1.45, 3.13);
  const cases = [
    ["Heatwave welfare checks", C.coral, "Rank apartment blocks by vulnerability and access."],
    ["Flood response triage", C.blue, "Prioritize zones with isolating roads and supply gaps."],
    ["Clinic outage routing", C.green, "Send generator, water, and transport to the best first site."],
    ["Campus safety ops", C.amber, "Coordinate volunteers without exposing sensitive data."],
  ];
  cases.forEach(([label, color, body], i) => {
    const x = 0.82 + (i % 2) * 3.05;
    const y = 2.55 + Math.floor(i / 2) * 1.56;
    slide.addShape(pptx.ShapeType.rect, { x, y, w: 2.55, h: 1.05, fill: { color: C.white }, line: { color: C.line, width: 0.45 } });
    slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h: 1.05, fill: { color }, line: { color } });
    text(slide, label, x + 0.2, y + 0.16, 2.1, 0.18, { fontSize: 10.5, bold: true, color });
    text(slide, body, x + 0.2, y + 0.48, 2.05, 0.34, { fontSize: 9, color: C.ink2, lineSpacingMultiple: 0.84 });
  });
  text(slide, "Why it can grow", 0.86, 5.82, 2.3, 0.24, { fontSize: 11.5, bold: true, color: C.ink });
  bulletList(
    slide,
    [
      "Static deploy today, data connectors later.",
      "Scoring remains transparent enough for local trust.",
      "Exports work even when the receiving team has no app login.",
    ],
    0.86,
    6.18,
    5.65,
    0.62,
  );
  page(slide, 5);
}

function slide6() {
  const slide = pptx.addSlide();
  addBg(slide, "101827");
  claim(
    slide,
    "Build plan",
    "The submission is complete enough for judges to run and inspect.",
    "No backend dependency is required for the prototype, which keeps the demo stable under deadline pressure.",
    true,
  );
  const parts = [
    ["Static app", "HTML/CSS/JS entry point", C.blue],
    ["Scoring engine", "Need, risk, access, confidence", C.green],
    ["Visual proof", "Canvas map and receipt export", C.amber],
    ["Persistence", "LocalStorage scenario state", C.coral],
  ];
  parts.forEach(([title, body, color], i) => {
    const x = 0.82 + i * 3.05;
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: 2.62,
      w: 2.38,
      h: 1.18,
      fill: { color: "172235" },
      line: { color: "334155", width: 0.55 },
    });
    slide.addShape(pptx.ShapeType.line, { x: x + 0.18, y: 2.92, w: 0.46, h: 0, line: { color, width: 2 } });
    text(slide, title, x + 0.18, 3.12, 1.9, 0.18, { fontSize: 11, bold: true, color: C.white });
    text(slide, body, x + 0.18, 3.42, 1.9, 0.25, { fontSize: 8.6, color: "CBD5E1", lineSpacingMultiple: 0.82 });
  });
  slide.addShape(pptx.ShapeType.line, { x: 1.65, y: 4.48, w: 9.7, h: 0, line: { color: "334155", width: 0.8 } });
  const roadmap = [
    ["Now", "Working prototype + package", C.green],
    ["Next", "GitHub repo + hosted demo", C.blue],
    ["Later", "SMS intake + city data feeds", C.amber],
    ["Trust", "Audit trail + incident templates", C.lilac],
  ];
  roadmap.forEach(([label, body, color], i) => {
    const x = 1.25 + i * 2.85;
    slide.addShape(pptx.ShapeType.ellipse, { x, y: 4.33, w: 0.32, h: 0.32, fill: { color }, line: { color } });
    text(slide, label, x - 0.12, 4.84, 0.76, 0.18, { fontSize: 9, bold: true, color });
    text(slide, body, x - 0.42, 5.14, 1.42, 0.34, { fontSize: 8.7, color: "D1D5DB", align: "center", lineSpacingMultiple: 0.84 });
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.82,
    y: 6.04,
    w: 11.1,
    h: 0.54,
    fill: { color: "18263A" },
    line: { color: "334155", width: 0.45 },
  });
  text(slide, "Submission checklist", 1.08, 6.23, 1.55, 0.15, { fontSize: 8.5, bold: true, color: "BFE6D3" });
  text(slide, "App, WebM demo, screenshots, pitch deck, field copy, runbook, and final QA are packaged locally.", 2.72, 6.2, 7.75, 0.18, {
    fontSize: 10,
    color: "E5E7EB",
  });
  page(slide, 6, true);
}

slide1();
slide2();
slide3();
slide4();
slide5();
slide6();

await pptx.writeFile({ fileName: "reliefgrid-pitch-deck.pptx" });
console.log("Created reliefgrid-pitch-deck.pptx");
