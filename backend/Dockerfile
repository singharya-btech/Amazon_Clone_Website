FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies required by psycopg2 (PostgreSQL adapter)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (leverages Docker layer caching)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Create a non-root user for security
RUN useradd --create-home --uid 10001 appuser

# Copy application code
COPY . .

# Create runtime directories and set ownership
RUN mkdir -p /app/data /app/media /app/staticfiles \
    && chown -R appuser:appuser /app

# Copy and make the entrypoint script executable
COPY --chmod=755 entrypoint.sh /entrypoint.sh

USER 10001

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
