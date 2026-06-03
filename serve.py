#!/usr/bin/env python3
"""Convenience entry point: `python serve.py` boots the ReliefGrid full stack.

Running this file by path puts the project root on sys.path, so ``backend`` is
importable without any PYTHONPATH juggling. The API serves under /api and the
single-page app under /, with interactive docs at /docs.
"""

from __future__ import annotations

import os
import sys

# Ensure the project root (this file's directory) is importable.
ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import uvicorn  # noqa: E402

from backend.app.main import app  # noqa: E402

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8031"))
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
