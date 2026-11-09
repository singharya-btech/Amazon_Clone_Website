#!/bin/sh
# Docker entrypoint for the Django backend.
#
# Runs database migrations and collects static files before handing off to
# Gunicorn.  This is safe to run on every container start:
#   - migrate  : only applies migrations that haven't been applied yet
#   - collectstatic : re-creates the staticfiles directory (idempotent)
#
# If the database is not yet ready, we wait for it (up to 60 s) before
# attempting migrations so the container doesn't crash-loop.

set -e

# ---------------------------------------------------------------------------
# Wait for the database to become reachable
# ---------------------------------------------------------------------------
DB_HOST="${POSTGRES_HOST:-database-service}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-marketplace}"
DB_NAME="${POSTGRES_DB:-marketplace}"

echo "⏳ Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT} ..."
for i in $(seq 1 60); do
    if python -c "
import os, sys
import psycopg2
try:
    conn = psycopg2.connect(
        host=os.environ.get('POSTGRES_HOST', '${DB_HOST}'),
        port=int(os.environ.get('POSTGRES_PORT', '${DB_PORT}')),
        user=os.environ.get('POSTGRES_USER', '${DB_USER}'),
        password=os.environ.get('POSTGRES_PASSWORD', ''),
        dbname=os.environ.get('POSTGRES_DB', '${DB_NAME}'),
    )
    conn.close()
except Exception:
    sys.exit(1)
" 2>/dev/null; then
        echo "✅ PostgreSQL is ready."
        break
    fi
    if [ "$i" -eq 60 ]; then
        echo "❌ PostgreSQL did not become ready within 60 seconds."
        exit 1
    fi
    sleep 1
done

# ---------------------------------------------------------------------------
# Run Django management commands
# ---------------------------------------------------------------------------
echo "📦 Applying database migrations ..."
python manage.py migrate --noinput

echo "🗂️  Collecting static files ..."
python manage.py collectstatic --noinput --clear

# ---------------------------------------------------------------------------
# Hand off to Gunicorn
# ---------------------------------------------------------------------------
echo "🚀 Starting Gunicorn ..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-2}" \
    --threads "${GUNICORN_THREADS:-4}" \
    --timeout "${GUNICORN_TIMEOUT:-60}" \
    --access-logfile - \
    --error-logfile -
