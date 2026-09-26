# ==============================================================================
# SettleCart Backend - Multi-stage Production Dockerfile
# Python 3.12-slim with non-root security, Gunicorn + Uvicorn workers
# ==============================================================================

# --- Stage 1: Build virtual environment and wheels ---
FROM python:3.12-slim AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt requirements-dev.txt ./

ARG DEV=false
RUN if [ "$DEV" = "true" ] ; then \
        pip install -r requirements-dev.txt ; \
    else \
        pip install -r requirements.txt ; \
    fi

# --- Stage 2: Final Minimal Runtime Image ---
FROM python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8000 \
    WEB_CONCURRENCY=2

# Install curl for container health check and clean package lists
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root application user and group
RUN groupadd -g 10001 appgroup \
    && useradd -u 10001 -g appgroup -s /bin/false -M -d /app appuser

# Copy virtualenv from builder stage
COPY --from=builder /opt/venv /opt/venv

# Copy application source code
COPY --chown=appuser:appgroup . /app/

# Switch to non-root user
USER appuser

EXPOSE 8000

# Docker healthcheck against lightweight liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Production ASGI server using Gunicorn with UvicornWorker
CMD ["sh", "-c", "exec gunicorn app.main:app -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 -w ${WEB_CONCURRENCY:-2} --timeout 60 --graceful-timeout 30 --access-logfile - --error-logfile -"]
