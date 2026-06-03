const url = process.argv[2];

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!url) {
  fail("Usage: node external-link-check.mjs <public-url>");
}

const parsed = new URL(url);
if (["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname)) {
  fail("External deliverable URL cannot be localhost/private.");
}

const response = await fetch(url, { method: "HEAD", redirect: "follow" }).catch(() => null);
if (!response || !response.ok) {
  fail(`URL did not return OK: ${response ? response.status : "fetch failed"}`);
}

console.log(`External link OK: ${response.status} ${response.url}`);

