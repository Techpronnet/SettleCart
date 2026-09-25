import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Any

from app.tasks.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60, name="send_email_notification")
def send_email_notification(
    self,
    to_email: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
) -> dict[str, Any]:
    """
    Sends an email notification asynchronously via Celery worker.
    Uses SMTP when SMTP_HOST is configured, or logs simulated delivery for development and testing.
    """
    if not settings.SMTP_HOST:
        logger.info(
            "[SIMULATED EMAIL] Delivered to: %s | Subject: %s | Length: %d chars",
            to_email,
            subject,
            len(html_body),
        )
        return {
            "status": "simulated",
            "to": to_email,
            "subject": subject,
            "message": "Email simulated in development mode",
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        if settings.SMTP_TLS:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())

        logger.info("Successfully delivered email to %s (Subject: %s)", to_email, subject)
        return {"status": "sent", "to": to_email, "subject": subject}

    except Exception as exc:
        logger.error("Failed to send email to %s: %s. Retrying...", to_email, exc)
        raise self.retry(exc=exc)

