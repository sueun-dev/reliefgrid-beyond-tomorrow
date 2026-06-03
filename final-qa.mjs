import fs from "node:fs";
import http from "node:http";
import { execFileSync } from "node:child_process";

const urls = [
  ["App", "/"],
  ["Devpost handoff", "/devpost-handoff.html"],
  ["Video maker", "/demo-video-maker.html"],
  ["Generated WebM", "/reliefgrid-demo-video.webm"],
];

function run(command, args) {
  console.log(`$ ${[command, ...args].join(" ")}`);
  execFileSync(command, args, { stdio: "inherit" });
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html";
  if (file.endsWith(".css")) return "text/css";
  if (file.endsWith(".js")) return "text/javascript";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".webm")) return "video/webm";
  return "application/octet-stream";
}

async function startServer() {
  const server = http.createServer((request, response) => {
    const path = request.url === "/" ? "index.html" : request.url.slice(1).split("?")[0];
    if (!fs.existsSync(path)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": contentType(path) });
    fs.createReadStream(path).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
}

async function assertUrl(base, label, path) {
  const response = await fetch(`${base}${path}`, { method: "HEAD" });
  if (!response.ok) throw new Error(`${label} did not return OK: ${response.status}`);
  console.log(`${label}: ${response.status} ${response.headers.get("content-type") || "unknown content-type"}`);
}

run("node", ["--check", "app.js"]);
run("node", ["qa-check.mjs"]);

const server = await startServer();
try {
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  for (const [label, path] of urls) {
    await assertUrl(base, label, path);
  }
} finally {
  server.close();
}

const zipEntries = execFileSync("unzip", ["-Z1", "reliefgrid-submission-package.zip"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
const requiredPackageEntries = [
  ".nojekyll",
  "index.html",
  "styles.css",
  "app.js",
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
  "build-pitch-deck.mjs",
  "devpost-handoff.html",
  "demo-video-maker.html",
  "reliefgrid-main.png",
  "reliefgrid-brief.png",
  "reliefgrid-mobile.png",
  "reliefgrid-demo-video.webm",
  "reliefgrid-pitch-deck.pptx",
  "start.md",
];
for (const entry of requiredPackageEntries) {
  if (!zipEntries.includes(entry)) throw new Error(`Submission package missing required entry: ${entry}`);
}
console.log(`Submission package entries checked: ${zipEntries.length}`);
console.log(`Demo video: ${Math.round(fs.statSync("reliefgrid-demo-video.webm").size / 1024)} KB`);
console.log(`Pitch deck: ${Math.round(fs.statSync("reliefgrid-pitch-deck.pptx").size / 1024)} KB`);
console.log("ReliefGrid final QA passed");
