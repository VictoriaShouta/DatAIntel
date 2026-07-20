"""stream_producer — Redpanda'ya sürekli satış/sensör olayı basan üreteç.

Gün 7'de M07 kapsamında gerçek olay üretimi (kafka-python / aiokafka ile)
implemente edilecek. Şimdilik bağlantı denemesi + sağlık logu ile iskelet.
"""

import logging
import os
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stream_producer")

BOOTSTRAP_SERVERS = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "redpanda:9092")


def main() -> None:
    logger.info("stream_producer başlatıldı (bootstrap=%s)", BOOTSTRAP_SERVERS)
    logger.info("Gerçek olay üretimi M07 (Gün 7) kapsamında eklenecek.")
    while True:
        time.sleep(30)
        logger.info("stream_producer bekleme modunda (iskelet)")


if __name__ == "__main__":
    main()
