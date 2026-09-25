import logging
import redis
from fastapi import Request
from slowapi import Limiter

from app.core.config import settings

logger = logging.getLogger(__name__)

def get_client_ip(request: Request) -> str:
    """
    Extracts the client IP address from request headers or direct socket connection.
    Supports reverse proxy setups (Nginx, Cloudflare, Vercel, AWS ALB) by checking:
    1. X-Forwarded-For (first hop / original client IP)
    2. CF-Connecting-IP (Cloudflare)
    3. X-Real-IP
    4. request.client.host
    """
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # X-Forwarded-For: <client>, <proxy1>, <proxy2>
        client_ip = forwarded_for.split(",")[0].strip()
        if client_ip:
            return client_ip

    cf_connecting_ip = request.headers.get("cf-connecting-ip")
    if cf_connecting_ip:
        return cf_connecting_ip.strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


def create_limiter() -> Limiter:
    """
    Initializes SlowAPI Limiter configured with Redis backend.
    Gracefully falls back to in-memory storage if Redis is temporarily unreachable.
    """
    storage_uri = settings.REDIS_URL
    try:
        r = redis.Redis.from_url(storage_uri, socket_connect_timeout=1)
        r.ping()
        logger.info("Rate limiter successfully connected to Redis storage at %s", storage_uri)
    except Exception as exc:
        logger.warning(
            "Redis storage unreachable for rate limiting (%s). Falling back to in-memory storage.",
            exc,
        )
        storage_uri = "memory://"

    return Limiter(
        key_func=get_client_ip,
        storage_uri=storage_uri,
        strategy="moving-window",
        headers_enabled=False,
        enabled=settings.RATE_LIMIT_ENABLED,
    )


limiter = create_limiter()
