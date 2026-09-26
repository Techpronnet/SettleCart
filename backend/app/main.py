from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.limiter import limiter
from app.api.v1.router import api_router
from app.core.exceptions import register_exception_handlers

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting SettleCart API...")
    yield
    logger.info("Shutting down SettleCart API...")

app = FastAPI(
    title="SettleCart API",
    description="Backend API for SettleCart Marketplace",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

register_exception_handlers(app)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

from sqlalchemy import text
from fastapi.responses import JSONResponse
import redis.asyncio as aioredis
from app.core.database import async_session_factory

@app.get("/")
async def root():
    return {"status": "healthy", "service": "SettleCart API", "version": "0.1.0"}

@app.get("/health")
async def health():
    """Lightweight liveness probe for Docker container healthchecks and Nginx proxy."""
    return {"status": "healthy", "service": "SettleCart API", "version": "0.1.0"}

@app.get("/ready")
async def readiness():
    """Readiness probe verifying external dependencies (Neon PostgreSQL and Redis)."""
    checks = {
        "status": "ready",
        "service": "SettleCart API",
        "version": "0.1.0",
        "database": "unknown",
        "redis": "unknown",
    }
    is_ready = True

    # 1. Check Neon PostgreSQL
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        checks["database"] = "connected"
    except Exception as exc:
        logger.error("Readiness check database failure: %s", exc)
        checks["database"] = "unhealthy"
        is_ready = False

    # 2. Check Redis
    try:
        r = aioredis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        await r.ping()
        await r.aclose()
        checks["redis"] = "connected"
    except Exception as exc:
        logger.error("Readiness check redis failure: %s", exc)
        checks["redis"] = "unhealthy"
        is_ready = False

    if not is_ready:
        checks["status"] = "degraded"
        return JSONResponse(status_code=503, content=checks)

    return checks

