import asyncio
import json
import logging
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional, Any, AsyncGenerator
import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)

class RealtimePubSubService:
    _redis_client: Optional[aioredis.Redis] = None
    # In-memory ticket storage fallback if Redis is unavailable in tests
    _memory_tickets: dict[str, tuple[UUID, float]] = {}
    _memory_locations: dict[str, dict[str, Any]] = {}

    @classmethod
    def get_redis(cls) -> aioredis.Redis:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if cls._redis_client is None or getattr(cls._redis_client, "_loop", None) != loop:
            cls._redis_client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
            )
            cls._redis_client._loop = loop
        return cls._redis_client

    @classmethod
    async def create_connection_ticket(cls, user_id: UUID, ttl_seconds: int = 30) -> str:
        """
        Generates an ephemeral, single-use ticket for WebSocket/SSE authentication.
        Stored in Redis with a 30-second TTL to avoid exposing JWTs in URL query strings.
        """
        ticket = uuid4().hex
        key = f"settlecart:ticket:{ticket}"
        try:
            r = cls.get_redis()
            await r.set(key, str(user_id), ex=ttl_seconds)
            logger.info("Created real-time connection ticket %s for user %s", ticket, user_id)
        except Exception as exc:
            logger.warning("Redis ticket creation failed (%s), using in-memory store", exc)
            import time
            cls._memory_tickets[ticket] = (user_id, time.time() + ttl_seconds)

        return ticket

    @classmethod
    async def verify_and_consume_ticket(cls, ticket: str) -> Optional[UUID]:
        """
        Validates and atomically deletes the single-use ticket upon handshake.
        Returns the associated user_id if valid, or None if expired/non-existent.
        """
        if not ticket:
            return None

        key = f"settlecart:ticket:{ticket}"
        try:
            r = cls.get_redis()
            # Atomically get and delete the ticket
            val = await r.getdel(key)
            if val:
                return UUID(val)
        except Exception as exc:
            logger.warning("Redis getdel failed (%s), checking in-memory store", exc)
            import time
            if ticket in cls._memory_tickets:
                user_id, expires_at = cls._memory_tickets.pop(ticket)
                if time.time() <= expires_at:
                    return user_id

        # In-memory check if Redis didn't have it
        import time
        if ticket in cls._memory_tickets:
            user_id, expires_at = cls._memory_tickets.pop(ticket)
            if time.time() <= expires_at:
                return user_id

        return None

    @classmethod
    async def publish_order_event(
        cls,
        order_id: UUID,
        event_type: str,
        data: dict[str, Any],
    ) -> None:
        """
        Publishes a real-time event to the Redis Pub/Sub channel for the specified order.
        All connected WebSockets and SSE listeners across worker instances receive this event.
        """
        payload = {
            "event_type": event_type,
            "order_id": str(order_id),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": data,
        }
        channel = f"settlecart:order:{order_id}"
        json_payload = json.dumps(payload, default=str)

        try:
            r = cls.get_redis()
            await r.publish(channel, json_payload)
            logger.debug("Published event %s to channel %s", event_type, channel)
        except Exception as exc:
            logger.warning("Failed to publish event to Redis channel %s: %s", channel, exc)

    @classmethod
    async def update_rider_location(
        cls,
        task_id: UUID,
        order_id: UUID,
        latitude: float,
        longitude: float,
        heading: Optional[float] = None,
        speed: Optional[float] = None,
    ) -> dict[str, Any]:
        """
        Caches rider GPS coordinates in Redis (1-hour TTL) and broadcasts the updated
        telemetry to all connected customer and vendor tracking listeners.
        """
        location_data = {
            "task_id": str(task_id),
            "latitude": latitude,
            "longitude": longitude,
            "heading": heading,
            "speed": speed,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        key = f"settlecart:task:{task_id}:location"
        json_loc = json.dumps(location_data)

        try:
            r = cls.get_redis()
            await r.set(key, json_loc, ex=3600)
        except Exception as exc:
            logger.warning("Failed to cache rider location in Redis: %s", exc)
            cls._memory_locations[str(task_id)] = location_data

        # Broadcast telemetry update to live tracking stream
        await cls.publish_order_event(
            order_id=order_id,
            event_type="RIDER_LOCATION_UPDATED",
            data=location_data,
        )
        return location_data

    @classmethod
    async def get_rider_location(cls, task_id: UUID) -> Optional[dict[str, Any]]:
        """Retrieves the latest cached rider GPS coordinates."""
        key = f"settlecart:task:{task_id}:location"
        try:
            r = cls.get_redis()
            val = await r.get(key)
            if val:
                return json.loads(val)
        except Exception as exc:
            logger.warning("Failed to get rider location from Redis: %s", exc)

        return cls._memory_locations.get(str(task_id))

    @classmethod
    async def subscribe_order_events(
        cls,
        order_id: UUID,
        check_disconnected: Optional[Any] = None,
    ) -> AsyncGenerator[dict[str, Any], None]:
        """
        Subscribes to an order's Redis Pub/Sub channel and yields real-time events.
        Automatically unsubscribes upon generator exit.
        """
        channel = f"settlecart:order:{order_id}"
        r = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
        )
        pubsub = r.pubsub()
        await pubsub.subscribe(channel)

        try:
            while True:
                if check_disconnected:
                    is_closed = check_disconnected()
                    if asyncio.iscoroutine(is_closed):
                        is_closed = await is_closed
                    if is_closed:
                        break

                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.5)
                if message and message.get("type") == "message":
                    raw_data = message.get("data")
                    if raw_data:
                        try:
                            event = json.loads(raw_data)
                            yield event
                        except Exception as parse_err:
                            logger.error("Failed to parse event JSON: %s", parse_err)
                await asyncio.sleep(0.05)
        finally:
            try:
                await asyncio.shield(pubsub.unsubscribe(channel))
            except BaseException:
                pass
            try:
                await asyncio.shield(pubsub.aclose())
            except BaseException:
                pass
            try:
                await asyncio.shield(r.aclose())
            except BaseException:
                pass
