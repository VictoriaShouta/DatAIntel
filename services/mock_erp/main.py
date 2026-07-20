"""mock_erp — sentetik ERP verisi servis eden yardımcı FastAPI uygulaması.

Gün 8'de M15 kapsamında satış/tedarik/envanter/finans/İK endpoint'leri
sentetik veriyle doldurulacak. Şimdilik sağlık kontrolü ve iskelet mevcut.
"""

from fastapi import FastAPI

app = FastAPI(title="DatAIntel Mock ERP", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "mock_erp"}
