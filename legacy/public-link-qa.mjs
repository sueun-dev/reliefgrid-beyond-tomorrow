const urls = {
  github: "https://github.com/sueun-dev/reliefgrid-beyond-tomorrow",
  liveDemo: "https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/",
  demoVideoPage: "https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/demo-video.html",
  demoVideoFile: "https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/reliefgrid-demo-video.webm",
  handoff: "https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/devpost-handoff.html",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function headOk(label, url) {
  const response = await fetch(url, { method: "HEAD", redirect: "follow" });
  assert(response.ok, `${label} did not return OK: ${response.status}`);
  console.log(`${label}: ${response.status} ${response.headers.get("content-type") || "unknown content-type"}`);
  return response;
}

async function textIncludes(label, url, needles) {
  const response = await fetch(url, { redirect: "follow" });
  assert(response.ok, `${label} did not return OK: ${response.status}`);
  const body = await response.text();
  for (const needle of needles) {
    assert(body.includes(needle), `${label} missing expected text: ${needle}`);
  }
  console.log(`${label}: ${response.status} text verified`);
}

await headOk("GitHub repository", urls.github);
await textIncludes("Live demo", urls.liveDemo, ["ReliefGrid", "Prioritize community response"]);
await textIncludes("Demo video page", urls.demoVideoPage, ["ReliefGrid Demo Video", "reliefgrid-demo-video.webm"]);
const video = await headOk("Demo video file", urls.demoVideoFile);
assert((video.headers.get("content-type") || "").includes("video/webm"), "Demo video file must be served as video/webm");
await textIncludes("Devpost handoff", urls.handoff, [
  "ReliefGrid Devpost Handoff",
  "https://github.com/sueun-dev/reliefgrid-beyond-tomorrow",
  "https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/demo-video.html",
]);

console.log("ReliefGrid public link QA passed");
