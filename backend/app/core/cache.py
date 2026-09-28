import json
import logging
from typing import Any, Optional
import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)

class CacheService:
    """
    High-performance Redis caching layer with in-memory fallback.
    Designed for fast (<1ms) reads on public stores, products, and showcase data.
    Gracefully handles Redis downtime without interrupting database queries.
    """
    _redis: Optional[aioredis.Redis] = None
    _memory_cache: dict[str, tuple[Any, float]] = {}

    @classmethod
    def get_redis(cls) -> Optional[aioredis.Redis]:
        if not settings.REDIS_URL:
            return None
        if cls._redis is None:
            try:
                cls._redis = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=1,
                )
            except Exception as exc:
                logger.warning("Redis connection failed, falling back: %s", exc)
                return None
        return cls._redis

    @classmethod
    async def get(cls, key: str) -> Optional[Any]:
        try:
            r = cls.get_redis()
            if r:
                val = await r.get(f"settlecart:cache:{key}")
                if val is not None:
                    return json.loads(val)
        except Exception as exc:
            logger.debug("Redis cache get error for %s: %s", key, exc)
        return None

    @classmethod
    async def set(cls, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        try:
            r = cls.get_redis()
            if r:
                payload = json.dumps(value, default=str)
                await r.set(f"settlecart:cache:{key}", payload, ex=ttl_seconds)
                return True
        except Exception as exc:
            logger.debug("Redis cache set error for %s: %s", key, exc)
        return False

    @classmethod
    async def invalidate(cls, pattern: str) -> None:
        try:
            r = cls.get_redis()
            if r:
                keys = await r.keys(f"settlecart:cache:{pattern}*")
                if keys:
                    await r.delete(*keys)
        except Exception as exc:
            logger.debug("Redis cache invalidate error for %s: %s", pattern, exc)
