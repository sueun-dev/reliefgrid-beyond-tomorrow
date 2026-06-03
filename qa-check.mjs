import fs from "node:fs";

const requiredFiles = [
  ".nojekyll",
  "index.html",
  "styles.css",
  "app.js",
  "package.json",
  "README.md",
  "submission.md",
  "DEVPOST_FIELDS.md",
  "SUBMIT_RUNBOOK.md",
  "JUDGE_BRIEF.md",
  "FINAL_GATE_STATUS.md",
  "AWARD_READINESS_AUDIT.md",
  "PUBLIC_LINKS_READINESS.md",
  "SYSTEM_QA.md",
  "demo-script.md",
  "demo-video.html",
  "build-pitch-deck.mjs",
  "devpost-handoff.html",
  "demo-video-maker.html",
  "external-link-check.mjs",
  "public-link-qa.mjs",
  "final-qa.mjs",
  "reliefgrid-main.png",
  "reliefgrid-brief.png",
  "reliefgrid-mobile.png",
  "reliefgrid-demo-video.webm",
  "reliefgrid-pitch-deck.pptx",
];

const requiredText = [
  ["index.html", "ReliefGrid"],
  ["index.html", "receiptExportPanel"],
  ["app.js", "buildReceiptCanvas"],
  ["app.js", "copyText"],
  ["app.js", "localStorage"],
  ["app.js", "loadSavedPlan"],
  ["app.js", "rankedZones"],
  ["styles.css", "grid-template-columns"],
  ["README.md", "Beyond Tomorrow Summit"],
  ["DEVPOST_FIELDS.md", "Prioritize response before the crisis spreads."],
  ["DEVPOST_FIELDS.md", "https://github.com/sueun-dev/reliefgrid-beyond-tomorrow"],
  ["DEVPOST_FIELDS.md", "https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/demo-video.html"],
  ["SUBMIT_RUNBOOK.md", "Do not click final Devpost submit from Codex"],
  ["JUDGE_BRIEF.md", "Innovation & Creativity"],
  ["AWARD_READINESS_AUDIT.md", "ReliefGrid is submit-worthy and credible for judging"],
  ["AWARD_READINESS_AUDIT.md", "307 participants"],
  ["PUBLIC_LINKS_READINESS.md", "sueun-dev/reliefgrid-beyond-tomorrow"],
  ["PUBLIC_LINKS_READINESS.md", "GitHub Pages is enabled"],
  ["SYSTEM_QA.md", "Issues Found And Fixed"],
  ["SYSTEM_QA.md", "Public deployment QA"],
  ["FINAL_GATE_STATUS.md", "June 5, 2026, 11:45 PM EDT"],
  ["public-link-qa.mjs", "ReliefGrid public link QA passed"],
  ["demo-video-maker.html", "MediaRecorder"],
  ["demo-video-maker.html", "reliefgrid-demo-video.webm"],
  ["demo-video.html", "ReliefGrid Demo Video"],
  ["demo-video.html", "reliefgrid-demo-video.webm"],
  ["build-pitch-deck.mjs", "pptxgenjs"],
  ["devpost-handoff.html", "ReliefGrid Devpost Handoff"],
  ["devpost-handoff.html", "GitHub URL"],
  ["devpost-handoff.html", "Judge Summary"],
  ["devpost-handoff.html", "demo-video.html"],
  ["devpost-handoff.html", "document.execCommand"],
  ["devpost-handoff.html", "reliefgrid-pitch-deck.pptx"],
  ["devpost-handoff.html", "User clicks final submit"],
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function text(file) {
  return fs.readFileSync(file, "utf8");
}

for (const file of requiredFiles) {
  assert(fs.existsSync(file), `Missing required file: ${file}`);
  assert(fs.statSync(file).size > 0, `Required file is empty: ${file}`);
}

for (const [file, needle] of requiredText) {
  assert(text(file).includes(needle), `${file} missing expected text: ${needle}`);
}

for (const file of ["index.html", "devpost-handoff.html", "demo-video.html", "demo-video-maker.html"]) {
  const refs = [...text(file).matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (ref.startsWith("#") || ref.startsWith("data:") || ref.startsWith("http://") || ref.startsWith("https://")) continue;
    const clean = decodeURIComponent(ref.split("#")[0].split("?")[0]).replace(/^\.\//, "");
    if (clean && clean !== ".") assert(fs.existsSync(clean), `${file} references missing local file: ${ref}`);
  }
}

const video = fs.readFileSync("reliefgrid-demo-video.webm");
assert(video.length > 1_000_000, "Demo video must be larger than 1 MB");
assert(video[0] === 0x1a && video[1] === 0x45 && video[2] === 0xdf && video[3] === 0xa3, "Demo video must have WebM header");

const deck = fs.readFileSync("reliefgrid-pitch-deck.pptx");
assert(deck.length > 100_000, "Pitch deck must be non-trivial");
assert(deck[0] === 0x50 && deck[1] === 0x4b, "Pitch deck must have PPTX/ZIP header");

console.log("ReliefGrid QA passed");
console.log(`Required files checked: ${requiredFiles.length}`);
