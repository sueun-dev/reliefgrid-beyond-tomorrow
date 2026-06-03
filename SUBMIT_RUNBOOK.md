# ReliefGrid Submit Runbook

You (the user) click final Devpost submit — not an automated tool.

## 1. Run the full stack

```bash
./run.sh
```

Open:

- App: <http://127.0.0.1:8031/>
- API docs (great to show judges): <http://127.0.0.1:8031/docs>

## 2. Run the quality gate

```bash
./.venv/bin/python qa.py
```

Expected ending:

```text
Result: 27 passed, 0 failed
```

## 3. Capture fresh media (new UI)

The screenshots/video must show the new full-stack UI. With the app running:

1. Screenshot the main dashboard (incident + mission + map + queue).
2. Screenshot the response map and a committed dispatch in history.
3. For the dispatch-brief image, just use the app's **Export PNG** (a current
   sample is committed as `reliefgrid-brief.png`).
4. Record a 60–75s screen capture following `demo-script.md`.

## 4. Publish the code

```bash
git add -A
git commit -m "ReliefGrid: full-stack rebuild (FastAPI + SQLite + new SPA)"
git push origin main   # remote: sueun-dev/reliefgrid-beyond-tomorrow
```

## 5. Decide the live-demo link

This is now a server app, so pick one:

- **Local demo (simplest):** run `./run.sh` during judging; show `/` and `/docs`.
- **Hosted (optional):** deploy the FastAPI service (e.g. Render / Railway / Fly).
  Start command: `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`.
  Install: `pip install -r requirements.txt`. SQLite works on a persistent disk;
  for ephemeral hosts the DB simply re-seeds on boot.

## 6. Paste Devpost fields

Use `DEVPOST_FIELDS.md` (Built With now lists the full stack).

## 7. Attach media + links

- Pitch deck: `reliefgrid-pitch-deck.pptx`
- Demo video: `reliefgrid-demo-video.mp4` (57s, new UI + real data, Qwen3-TTS narration) — or your own screen recording
- GitHub repository URL
- Fresh screenshots from step 3

## 8. Preview, then submit

Check:

- Project name is `ReliefGrid`.
- The first paragraph says exactly what the product does.
- "Built With" reflects the full stack (FastAPI, SQLAlchemy/SQLite, …).
- The demo video and GitHub links open without login.
- The pitch deck and screenshots are visible.
- You click final submit.
