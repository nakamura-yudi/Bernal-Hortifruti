#!/bin/sh
set -eu

echo "Applying database migrations..."
alembic -c alembic/alembic.ini upgrade head

echo "Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
