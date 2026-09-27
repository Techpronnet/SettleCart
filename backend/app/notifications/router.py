from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.notifications.schemas import (
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
)
from app.notifications.service import NotificationService

router = APIRouter()

@router.get("", response_model=NotificationListResponse)
@router.get("/", response_model=NotificationListResponse)
async def list_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read or unread status"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves paginated in-app notifications for the authenticated user."""
    notifications, total, unread_count = await NotificationService.list_user_notifications(
        db, user_id=current_user.id, is_read=is_read, page=page, size=size
    )
    return NotificationListResponse(
        notifications=notifications,
        total=total,
        unread_count=unread_count,
        page=page,
        size=size,
    )

@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the total number of unread in-app notifications for notification badge counters."""
    count = await NotificationService.get_unread_count(db, user_id=current_user.id)
    return UnreadCountResponse(unread_count=count)

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marks a single notification as read."""
    notification = await NotificationService.mark_as_read(
        db, notification_id=notification_id, user_id=current_user.id
    )
    await db.commit()
    await db.refresh(notification)
    return notification

@router.post("/mark-all-read", status_code=status.HTTP_200_OK)
async def mark_all_notifications_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marks all unread notifications for the authenticated user as read."""
    count = await NotificationService.mark_all_read(db, user_id=current_user.id)
    await db.commit()
    return {"status": "success", "marked_read": count}

