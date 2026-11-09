#!/bin/sh
set -e

echo "Waiting for PostgreSQL database..."
python - << 'EOF'
import os, time, psycopg2

host = os.environ.get('POSTGRES_HOST', 'database-service')
port = os.environ.get('POSTGRES_PORT', '5432')
db = os.environ.get('POSTGRES_DB', 'amazon_v3')
user = os.environ.get('POSTGRES_USER', 'amazon_user')
password = os.environ.get('POSTGRES_PASSWORD', 'amazon_pass')

for i in range(30):
    try:
        conn = psycopg2.connect(host=host, port=port, dbname=db, user=user, password=password)
        conn.close()
        print("PostgreSQL is ready!")
        break
    except Exception as e:
        print(f"Waiting for Postgres ({i+1}/30): {e}")
        time.sleep(2)
else:
    print("Warning: Timed out waiting for PostgreSQL. Attempting migrations anyway...")
EOF

echo "Applying database migrations for Version 3..."
python manage.py makemigrations core products cart wishlist orders reviews
python manage.py migrate

echo "Seeding initial product catalog..."
python manage.py seed_v1_data || true

echo "Starting Gunicorn server for Version 3..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2
