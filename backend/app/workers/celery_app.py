from celery import Celery
from app.config import settings


celery = Celery(
    "document_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.REDIS_URL,
 include=["app.workers.tasks"]
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)