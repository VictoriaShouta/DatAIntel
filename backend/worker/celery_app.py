"""Celery uygulaması — modül görevleri (tasks.py) burada kaydedilir.

Görev kayıtları modül geliştirme ilerledikçe (Gün 4+) `include` listesine
eklenecektir, örn. "modules.m03_analytics.tasks".
"""

from celery import Celery

from core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "datAIntel",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Istanbul",
    enable_utc=True,
)
