# ReliefGrid Public Links Readiness

Checked on June 3, 2026.

## Current State

- GitHub CLI is authenticated as `sueun-dev`.
- Local branch is `main`.
- No remote is currently configured.
- `sueun-dev/reliefgrid-beyond-tomorrow` does not currently exist on GitHub.
- Secret-pattern scan returned no matches across tracked source/docs, excluding binary media and the zip package.
- Required local media exists: `reliefgrid-demo-video.webm`, `reliefgrid-pitch-deck.pptx`, `reliefgrid-main.png`, `reliefgrid-brief.png`, `reliefgrid-mobile.png`.

## Recommended Public URLs

Use these exact targets once the repo is published:

- GitHub repository: `https://github.com/sueun-dev/reliefgrid-beyond-tomorrow`
- Live demo: `https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/`
- Demo video page: `https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/demo-video.html`
- Handoff page: `https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/devpost-handoff.html`

For the demo video URL, safest options are:

1. Use the GitHub Pages video page if Devpost accepts a public page URL.
2. Upload `reliefgrid-demo-video.webm` as an unlisted video if the platform accepts WebM.
3. Use the GitHub raw file link only if Devpost accepts it as a video URL.

## Publish Commands If User Approves

Do not run these until the user approves public publishing.

```bash
gh repo create sueun-dev/reliefgrid-beyond-tomorrow --public --source . --remote origin --push
```

After the push, enable GitHub Pages from the `main` branch root in GitHub settings, or use the GitHub API if available.

Then verify:

```bash
node external-link-check.mjs https://github.com/sueun-dev/reliefgrid-beyond-tomorrow
node external-link-check.mjs https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/
node external-link-check.mjs https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/demo-video.html
node external-link-check.mjs https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/devpost-handoff.html
```

Also open each link in a private/incognito browser before final Devpost submit.

## Submit Boundary

Creating public GitHub / live demo links is still before final Devpost submit. The user should still click the final Devpost submit button manually.
