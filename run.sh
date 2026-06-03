#!/usr/bin/env bash
# ReliefGrid — one-command full-stack run.
# Creates a local virtualenv, installs dependencies, and serves the app
# (frontend + REST API + SQLite DB) at http://127.0.0.1:8031.
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8031}"

if [ ! -d .venv ]; then
  echo "→ Creating virtualenv (.venv)…"
  python3 -m venv .venv
fi

echo "→ Installing dependencies…"
./.venv/bin/python -m pip install --quiet --upgrade pip
./.venv/bin/python -m pip install --quiet -r requirements.txt

echo ""
echo "  ReliefGrid is starting:"
echo "    App         →  http://127.0.0.1:${PORT}/"
echo "    API docs    →  http://127.0.0.1:${PORT}/docs"
echo "    Health      →  http://127.0.0.1:${PORT}/api/health"
echo ""

exec ./.venv/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port "${PORT}"
