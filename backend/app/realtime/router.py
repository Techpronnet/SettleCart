import asyncio
import json
import logging
from uuid import UUID
from typing import Optional, Any
from datetime import datetime, timezone
from fastapi import (
    APIRouter,
    Depends,
    WebSocket,
    WebSocketDisconnect,
    Query,
    Request,
    HTTPException,
    status,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db, async_session_factory
from app.core.dependencies import get_current_user
from app.core.security import decode_token
from app.core.exceptions import ForbiddenException, NotFoundException, UnauthorizedException
from app.models.user import User
from app.models.order import Order, VendorOrder
from app.models.store import Store
from app.models.business import Business
from app.models.delivery import DeliveryTask
from app.models.enums import UserRole
from app.realtime.schemas import TicketResponse, TrackingSummaryResponse
from app.realtime.pubsub import RealtimePubSubService
from app.realtime.manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter()

async def get_user_from_auth(
    ticket: Optional[str] = None,
    token: Optional[str] = None,
    db: Optional[AsyncSession] = None,
) -> Optional[User]:
    """
    Authenticates user via either:
    1. Single-use ephemeral ticket (Option A - Zero credential exposure in URL)
    2. Fallback JWT access token
    """
    user_id: Optional[UUID] = None

    if ticket:
        user_id = await RealtimePubSubService.verify_and_consume_ticket(ticket)

    if not user_id and token:
        try:
            payload = decode_token(token)
            sub = payload.get("sub")
            if sub:
                user_id = UUID(sub)
        except Exception:
            return None

    if not user_id or db is None:
        return None

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def verify_order_access(order_id: UUID, user: User, db: AsyncSession) -> Order:
    """
    Verifies that the user has legitimate access to track the order:
    - Customer who placed the order
    - Vendor who owns a store fulfilled by this order
    - Assigned dispatch rider
    - Admin
    """
    stmt = (
        select(Order)
        .options(
            selectinload(Order.vendor_orders)
            .selectinload(VendorOrder.store)
            .selectinload(Store.business),
            selectinload(Order.delivery_tasks),
        )
        .where(Order.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if not order:
        raise NotFoundException(f"Order {order_id} not found")

    is_customer = order.customer_id == user.id
    is_admin = user.role == UserRole.ADMIN
    is_rider = any(dt.rider_id == user.id for dt in order.delivery_tasks)
    is_vendor = any(
        vo.store
        and vo.store.business
        and vo.store.business.owner_id == user.id
        for vo in order.vendor_orders
    )

    if not (is_customer or is_admin or is_rider or is_vendor):
        raise ForbiddenException("You are not authorized to track this order")

    return order

async def build_tracking_summary(order: Order) -> dict[str, Any]:
    """Constructs a full tracking summary including latest cached rider telemetry."""
    tasks_summary = []
    latest_location = None

    for dt in order.delivery_tasks:
        loc = await RealtimePubSubService.get_rider_location(dt.id)
        if loc and not latest_location:
            latest_location = loc
        tasks_summary.append({
            "id": str(dt.id),
            "vendor_order_id": str(dt.vendor_order_id),
            "status": dt.status.value,
            "rider_id": str(dt.rider_id) if dt.rider_id else None,
            "pickup_city": dt.pickup_city,
            "dropoff_city": dt.dropoff_city,
            "assigned_at": dt.assigned_at.isoformat() if dt.assigned_at else None,
            "accepted_at": dt.accepted_at.isoformat() if dt.accepted_at else None,
            "picked_up_at": dt.picked_up_at.isoformat() if dt.picked_up_at else None,
            "delivered_at": dt.delivered_at.isoformat() if dt.delivered_at else None,
            "current_location": loc,
        })

    vendor_orders_summary = [
        {
            "id": str(vo.id),
            "store_id": str(vo.store_id),
            "store_name": vo.store.name if vo.store else "",
            "status": vo.status.value,
            "subtotal": float(vo.subtotal),
        }
        for vo in order.vendor_orders
    ]

    return {
        "order_id": str(order.id),
        "order_number": order.order_number,
        "status": order.status.value,
        "customer_id": str(order.customer_id),
        "delivery_address": order.delivery_address,
        "delivery_city": order.delivery_city,
        "delivery_phone": order.delivery_phone,
        "vendor_orders": vendor_orders_summary,
        "delivery_tasks": tasks_summary,
        "latest_rider_location": latest_location,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/realtime/ticket", response_model=TicketResponse)
async def generate_connection_ticket(
    current_user: User = Depends(get_current_user),
):
    """
    Issues a short-lived (30s) single-use connection ticket for WebSocket/SSE tracking.
    Prevents leaking long-lived JWTs in URL query parameters or proxy logs.
    """
    ticket = await RealtimePubSubService.create_connection_ticket(current_user.id)
    return TicketResponse(ticket=ticket, expires_in_seconds=30)


@router.get("/orders/{order_id}/tracking-summary", response_model=TrackingSummaryResponse)
async def get_tracking_summary(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns initial tracking state, vendor order milestones, delivery tasks,
    and latest rider GPS coordinates for client map initialization.
    """
    order = await verify_order_access(order_id, current_user, db)
    summary = await build_tracking_summary(order)
    return summary


@router.websocket("/ws/orders/{order_id}")
async def websocket_order_tracking(
    websocket: WebSocket,
    order_id: UUID,
    ticket: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Live Order & Delivery Tracking WebSocket:
    - Authenticates via single-use ticket (?ticket=...) or JWT (?token=...)
    - Enforces tenant isolation (Customer, Vendor, Rider, or Admin only)
    - Emits initial order snapshot
    - Streams live status transitions and rider GPS movements via Redis Pub/Sub
    """
    # 1. Authenticate user
    user = await get_user_from_auth(ticket=ticket, token=token, db=db)
    if not user:
        # 4401: Unauthorized
        await websocket.close(code=4401, reason="Authentication failed: invalid or expired ticket/token")
        return

    # 2. Check Order Authorization
    try:
        order = await verify_order_access(order_id, user, db)
        initial_summary = await build_tracking_summary(order)
    except (NotFoundException, ForbiddenException) as exc:
        # 4403: Forbidden / Access Denied
        await websocket.close(code=4403, reason=str(exc.detail))
        return

    # 3. Accept Connection
    await ws_manager.connect(order_id, websocket)

    # 4. Send Initial Snapshot
    await ws_manager.send_event(websocket, {
        "event_type": "TRACKING_CONNECTED",
        "order_id": str(order_id),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": initial_summary,
    })

    # 5. Background Task: Stream from Redis Pub/Sub to WebSocket
    async def redis_event_listener():
        try:
            async for event in RealtimePubSubService.subscribe_order_events(order_id):
                await ws_manager.send_event(websocket, event)
        except asyncio.CancelledError:
            pass
        except Exception as err:
            logger.debug("Redis listener error on order %s: %s", order_id, err)

    listener_task = asyncio.create_task(redis_event_listener())

    # 6. Listen for Client Messages / Heartbeats
    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                msg = json.loads(raw_text)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
            except Exception:
                pass
    except WebSocketDisconnect:
        logger.info("Client disconnected from order %s tracking", order_id)
    finally:
        listener_task.cancel()
        ws_manager.disconnect(order_id, websocket)


@router.get("/orders/{order_id}/live-tracking")
async def sse_order_tracking(
    request: Request,
    order_id: UUID,
    ticket: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Server-Sent Events (SSE) Live Tracking Endpoint:
    Provides unidirectional HTTP push stream for web and mobile clients using EventSource.
    """
    # Check Authorization header if ticket/token not in query
    if not ticket and not token:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    user = await get_user_from_auth(ticket=ticket, token=token, db=db)
    if not user:
        raise UnauthorizedException("Authentication required for live tracking stream")

    order = await verify_order_access(order_id, user, db)
    initial_summary = await build_tracking_summary(order)

    async def event_generator():
        # Yield initial snapshot
        init_payload = {
            "event_type": "TRACKING_CONNECTED",
            "order_id": str(order_id),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": initial_summary,
        }
        yield f"event: TRACKING_CONNECTED\ndata: {json.dumps(init_payload, default=str)}\n\n"

        # Stream real-time events from Redis
        try:
            async for event in RealtimePubSubService.subscribe_order_events(order_id):
                if await request.is_disconnected():
                    break
                event_name = event.get("event_type", "message")
                yield f"event: {event_name}\ndata: {json.dumps(event, default=str)}\n\n"
        except asyncio.CancelledError:
            pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
