import logging
import httpx
from typing import Any

from app.tasks.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)

def normalize_nigerian_phone(phone: str) -> str:
    """Standardizes Nigerian phone numbers to international 234 format for SMS gateways."""
    clean = "".join(filter(str.isdigit, phone))
    if clean.startswith("0") and len(clean) == 11:
        return "234" + clean[1:]
    if clean.startswith("234") and len(clean) == 13:
        return clean
    if len(clean) == 10:
        return "234" + clean
    return clean

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60, name="send_sms_notification")
def send_sms_notification(self, to_phone: str, message: str) -> dict[str, Any]:
    """
    Sends an SMS notification asynchronously via Celery worker.
    Integrates with Termii SMS Gateway when configured, or simulates delivery for development/test environments.
    """
    normalized_phone = normalize_nigerian_phone(to_phone)

    if not settings.TERMII_API_KEY:
        logger.info(
            "[SIMULATED SMS] Sent to: %s (Normalized: %s) | Message: %s",
            to_phone,
            normalized_phone,
            message,
        )
        return {
            "status": "simulated",
            "to": normalized_phone,
            "message": message,
            "channel": "termii_simulated",
        }

    try:
        payload = {
            "to": normalized_phone,
            "from": settings.TERMII_SENDER_ID,
            "sms": message,
            "type": "plain",
            "channel": "generic",
            "api_key": settings.TERMII_API_KEY,
        }
        with httpx.Client(timeout=10.0) as client:
            res = client.post(f"{settings.TERMII_API_URL}/sms/send", json=payload)
            res.raise_for_status()
            data = res.json()
            logger.info("Termii SMS delivered to %s: %s", normalized_phone, data)
            return {"status": "sent", "to": normalized_phone, "provider_response": data}

    except Exception as exc:
        logger.error("Failed to send SMS to %s: %s. Retrying...", normalized_phone, exc)
        raise self.retry(exc=exc)

