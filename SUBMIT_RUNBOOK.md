# ReliefGrid Submit Runbook

Do not click final Devpost submit from Codex. The user submits.

## 1. Start Local Preview

```bash
python3 -m http.server 8031
```

Open:

```text
http://127.0.0.1:8031/devpost-handoff.html
```

## 2. Run Final QA

```bash
node final-qa.mjs
```

Expected ending:

```text
ReliefGrid final QA passed
```

## 3. Use Public Links

Required by the hackathon:

- GitHub repository link: https://github.com/sueun-dev/reliefgrid-beyond-tomorrow
- Demo video link: https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/demo-video.html
- Live demo link: https://sueun-dev.github.io/reliefgrid-beyond-tomorrow/
- Pitch deck file.
- Screenshots or product images.

Use `reliefgrid-demo-video.webm` only if Devpost rejects the GitHub Pages video page.

## 4. Check External Links

```bash
node external-link-check.mjs <github-or-video-or-live-demo-url>
```

Also open each link in a private/incognito browser. Do not use a `127.0.0.1` URL as a required external deliverable.

## 5. Paste Devpost Fields

Use:

- `DEVPOST_FIELDS.md`
- `devpost-handoff.html`

## 6. Upload Media

Recommended order:

1. `reliefgrid-main.png`
2. `reliefgrid-brief.png`
3. `reliefgrid-mobile.png`

Attach:

- `reliefgrid-pitch-deck.pptx`
- External demo video URL
- GitHub repository URL

## 7. Preview, Then User Submits

Check:

- The project name is `ReliefGrid`.
- The first paragraph says exactly what the product does.
- The demo video link opens without login.
- The GitHub repository link opens without login.
- The pitch deck is attached.
- The screenshots are visible.
- User clicks final submit.
