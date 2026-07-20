"""Uygulama genelinde tutarlı log formatı için merkezi kurulum."""

import logging

from core.config import get_settings


def setup_logging() -> None:
    settings = get_settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
