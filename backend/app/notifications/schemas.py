from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, Any
from app.models.enums import NotificationChannel, NotificationEventType

class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    message: str
    channel: NotificationChannel
    event_type: NotificationEventType
    data: Optional[dict[str, Any]] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    total: int
    unread_count: int
    page: int
    size: int

class UnreadCountResponse(BaseModel):
    unread_count: int

