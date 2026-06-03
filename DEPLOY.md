# Deploying ReliefGrid (public live-demo link)

ReliefGrid is a real full-stack app (FastAPI + SQLite), so it needs a host that
runs a container — not static hosting like GitHub Pages. The included `Dockerfile`
works on any container platform. Two free, fast options below.

The app boots, creates its SQLite schema, and **seeds real scenarios from live
Open-Meteo data** on first start (needs outbound internet, which all these hosts
allow). First boot takes ~5–10 s while it fetches live data.

---

## Option A — Render (recommended, has a free tier)

**Blueprint (one click, uses `render.yaml`):**
1. Push this repo to GitHub (see `SUBMIT_RUNBOOK.md`).
2. Go to <https://dashboard.render.com> → **New → Blueprint**.
3. Select your repo. Render reads `render.yaml`, builds the `Dockerfile`, and deploys.
4. You get a public URL like `https://reliefgrid.onrender.com`. That's your Devpost **Live demo** link.

**Manual (no blueprint):**
1. **New → Web Service** → connect the repo.
2. Runtime: **Docker**. Health check path: `/api/health`. Plan: **Free**.
3. Create. Done.

> Free instances sleep after inactivity and reset their disk on redeploy. That's
> fine here — the database simply re-seeds real data on the next boot.

---

## Option B — Railway

1. <https://railway.app> → **New Project → Deploy from GitHub repo**.
2. Railway detects the `Dockerfile` and builds it.
3. In **Settings → Networking**, click **Generate Domain** for a public URL.
4. Railway injects `$PORT` automatically; the Dockerfile already honors it.

---

## Option C — Fly.io

```bash
fly launch --no-deploy        # detects the Dockerfile; accept defaults
fly deploy
fly open                      # opens the public URL
```

---

## Run the container locally (sanity check before deploying)

```bash
docker build -t reliefgrid .
docker run -p 8031:8031 reliefgrid
# open http://127.0.0.1:8031/
```

---

## After deploying

- Put the public URL in Devpost's **Live demo** field.
- Smoke-test it: `curl https://YOUR-URL/api/health` → `{"status":"ok",...}`.
- Interactive API docs are live at `https://YOUR-URL/docs`.
- Optional: run the public-link check — `./.venv/bin/python external-link-check.mjs` is
  for the old static flow; for the live app just confirm `/api/health` returns ok.

### Note on persistence
The free tiers use an ephemeral filesystem, so committed dispatches don't survive a
redeploy. For a persisted demo, attach a small volume (Render Disk / Railway Volume /
Fly Volume) mounted where `RELIEFGRID_DATABASE_URL` points, e.g.:

```
RELIEFGRID_DATABASE_URL=sqlite:////data/reliefgrid.db   # with a volume mounted at /data
```
