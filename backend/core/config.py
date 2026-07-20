"""Uygulama ayarları — ortam değişkenlerinden Pydantic Settings ile okunur."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    log_level: str = "INFO"

    database_url: str = "postgresql+psycopg://datAIntel:change_me@postgres:5432/datAIntel"

    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/1"

    kafka_bootstrap_servers: str = "redpanda:9092"

    mlflow_tracking_uri: str = "http://mlflow:5000"

    jwt_secret_key: str = "change_me_dev_only"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    mock_erp_base_url: str = "http://mock_erp:8001"


@lru_cache
def get_settings() -> Settings:
    return Settings()
