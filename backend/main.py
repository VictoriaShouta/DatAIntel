"""DatAIntel backend — FastAPI uygulaması.

Router kayıtları modül geliştirme ilerledikçe (Gün 3+) burada eklenecektir:
    app.include_router(m01_ingest.router.router, prefix="/api/m01", tags=["M01"])
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.logging import setup_logging
from core.metrics import setup_metrics

setup_logging()

app = FastAPI(
    title="DatAIntel API",
    description="Yapay Zeka Destekli Akıllı Veri Analitiği ve Tahmin Sistemi",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_metrics(app)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "backend"}
