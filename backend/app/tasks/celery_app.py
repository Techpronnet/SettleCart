from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "settlecart",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.notifications",
        "app.tasks.email",
        "app.tasks.sms",
    ],
)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Lagos",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "reconcile_abandoned_payments_every_30m": {
            "task": "reconcile_abandoned_payments",
            "schedule": 1800.0,
        },
        "cleanup_old_notifications_weekly": {
            "task": "cleanup_old_notifications",
            "schedule": 604800.0,
        },
    },
)
celery_app.autodiscover_tasks(["app.tasks"])
