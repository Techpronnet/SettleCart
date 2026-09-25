from pydantic import BaseModel, Field
from typing import Optional, Any, List
from uuid import UUID
from datetime import datetime
from enum import Enum

class TrackingEventType(str, Enum):
    ORDER_STATUS_CHANGED = "ORDER_STATUS_CHANGED"
    VENDOR_ORDER_STATUS_CHANGED = "VENDOR_ORDER_STATUS_CHANGED"
    DISPATCH_TASK_UPDATED = "DISPATCH_TASK_UPDATED"
    RIDER_LOCATION_UPDATED = "RIDER_LOCATION_UPDATED"
    DELIVERY_COMPLETED = "DELIVERY_COMPLETED"
    TRACKING_CONNECTED = "TRACKING_CONNECTED"

class TicketResponse(BaseModel):
    ticket: str
    expires_in_seconds: int = 30
    token_type: str = "ticket"

class RiderLocationPayload(BaseModel):
    latitude: float
    longitude: float
    heading: Optional[float] = None
    speed: Optional[float] = None
    updated_at: str

class RealtimeEvent(BaseModel):
    event_type: TrackingEventType
    order_id: UUID
    timestamp: str
    data: dict[str, Any]

class TrackingSummaryResponse(BaseModel):
    order_id: UUID
    order_number: str
    status: str
    customer_id: UUID
    delivery_address: str
    delivery_city: str
    delivery_phone: str
    vendor_orders: List[dict[str, Any]]
    delivery_tasks: List[dict[str, Any]]
    latest_rider_location: Optional[dict[str, Any]] = None

