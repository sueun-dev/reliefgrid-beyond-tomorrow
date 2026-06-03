# ReliefGrid — full-stack container (FastAPI + SQLite + live Open-Meteo data)
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code.
COPY backend ./backend
COPY frontend ./frontend
COPY serve.py .

# Hosts (Render/Railway/Fly) inject $PORT; default to 8031 locally.
ENV PORT=8031
EXPOSE 8031

# Bind to 0.0.0.0 so the platform can route to it. The DB is created and
# seeded from live data on first boot.
CMD ["sh", "-c", "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8031}"]
