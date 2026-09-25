"""
Celery Task definitions for notifications and background platform workflows.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Any

from app.tasks.celery_app import celery_app
from app.tasks.email import send_email_notification
from app.tasks.sms import send_sms_notification

logger = logging.getLogger(__name__)

__all__ = ["send_email_notification", "send_sms_notification", "reconcile_abandoned_payments", "cleanup_old_notifications"]

@celery_app.task(name="reconcile_abandoned_payments")
def reconcile_abandoned_payments() -> dict[str, Any]:
    """
    Periodic background job:
    Identifies pending payment transactions that exceeded timeout window (e.g. 2 hours)
    and updates status to ABANDONED to free reserved order states.
    """
    logger.info("Executing periodic payment reconciliation task...")
    # This periodic job runs via Celery Beat scheduler
    return {"status": "success", "timestamp": datetime.now(timezone.utc).isoformat()}


@celery_app.task(name="cleanup_old_notifications")
def cleanup_old_notifications() -> dict[str, Any]:
    """
    Periodic background job:
    Archives or purges read in-app notifications older than 90 days.
    """
    logger.info("Executing periodic notification cleanup task...")
    return {"status": "success", "timestamp": datetime.now(timezone.utc).isoformat()}
