# DatAIntel — Mimari Doküman

> Bu doküman kod öncesi üretilen `docs/SOTA.md` (teknoloji seçim gerekçeleri) ve
> `docs/SRS.md`'nin (FR/NFR, personalar, izlenebilirlik matrisi) üzerine kurulur;
> onlardaki gerekçeleri tekrar üretmez. Mimari kararların kanonik kaynağı
> [`CLAUDE.md`](../CLAUDE.md)'dir; bu doküman onu görselleştirir.

## 1. Katman Şeması

```mermaid
flowchart TB
    subgraph Client["İstemci"]
        FE["Frontend<br/>React + Vite + Tailwind"]
    end

    subgraph App["Uygulama Katmanı"]
        API["Backend — FastAPI<br/>main.py + core/ + modules/m01..m15"]
        WORKER["Worker — Celery<br/>(analitik, tahmin, rapor, yedekleme, ERP sync)"]
        BEAT["Celery beat<br/>(zamanlanmış görevler)"]
    end

    subgraph Data["Veri Katmanı"]
        PG[("PostgreSQL 16")]
        REDIS[("Redis<br/>broker + result backend + rate limit")]
        RP[("Redpanda<br/>Kafka API uyumlu")]
    end

    subgraph ML["Model Yaşam Döngüsü"]
        MLF["MLflow<br/>deney takibi + model kayıt defteri"]
    end

    subgraph Obs["İzleme"]
        PROM["Prometheus"]
        GRAF["Grafana"]
    end

    subgraph Aux["Yardımcı Servisler"]
        ERP["mock_erp<br/>satış/tedarik/envanter/finans/İK"]
        STREAM["stream_producer<br/>sürekli olay üretimi"]
    end

    FE -- "REST + WebSocket" --> API
    API --> PG
    API -- "görev kuyruğa alma" --> REDIS
    REDIS --> WORKER
    BEAT --> REDIS
    WORKER --> PG
    WORKER --> MLF
    API --> MLF
    STREAM --> RP
    RP -- "consumer" --> API
    API -- "WebSocket yayını" --> FE
    ERP -- "periyodik çekme (connector)" --> API
    API -- metrics --> PROM
    PROM --> GRAF
```

## 2. Modül Bağımlılık Grafiği

Kural (bkz. CLAUDE.md § Kod Konvansiyonları, SRS NFR-M-4): bağımlılık **tek
yönlü**, yüksek numaralı modül düşük numaralıyı `service.py` üzerinden
kullanabilir; hiçbir modül başka bir modülün `router.py`'sini import edemez.

```mermaid
flowchart LR
    M10["M10 Kullanıcı Yönetimi"]
    M01["M01 Veri Girişi/Ön İşleme"]
    M02["M02 Veri Depolama"]
    M03["M03 Gelişmiş Analitik"]
    M04["M04 Tahmin ve Öngörü"]
    M05["M05 Karar Destek"]
    M06["M06 Raporlama/Görselleştirme"]
    M07["M07 Gerçek Zamanlı İşleme"]
    M08["M08 Veri Güvenliği (PoC)"]
    M09["M09 API/Entegrasyon"]
    M11["M11 Güncelleme/Bakım (PoC)"]
    M12["M12 Yedekleme/Kurtarma (PoC)"]
    M13["M13 Performans İzleme (PoC)"]
    M14["M14 Model Eğitimi (MLflow)"]
    M15["M15 ERP Entegrasyonu (PoC)"]

    M01 --> M02
    M03 --> M02
    M04 --> M02
    M04 --> M14
    M05 --> M03
    M05 --> M04
    M06 --> M03
    M06 --> M04
    M06 --> M05
    M07 --> M02
    M09 --> M02
    M15 --> M02
    M15 --> M04
    M15 --> M05

    M01 -.RBAC.-> M10
    M02 -.RBAC.-> M10
    M03 -.RBAC.-> M10
    M04 -.RBAC.-> M10
    M05 -.RBAC.-> M10
    M06 -.RBAC.-> M10
    M07 -.RBAC.-> M10
    M08 -.audit.-> M02
    M09 -.rate limit.-> M10
    M11 -.middleware.-> M10
    M12 -.beat.-> M02
    M13 -.metrics.-> M09
```

Not: kesikli oklar ("RBAC", "audit", "metrics") doğrudan servis çağrısı değil,
çapraz kesen (cross-cutting) bağımlılıkları gösterir — `core/auth.py`,
`core/logging.py`, `core/metrics.py` üzerinden merkezi olarak sağlanır, modül
kendi kendine yeniden implemente etmez.

## 3. ER Diyagramı (Çekirdek Şema)

Aşağıdaki şema, Gün 3+'ta modül geliştirme sırasında Alembic migration'larıyla
kurulacak çekirdek tabloları gösterir; her modülün kendi PoC/tam işlevine özgü
ek tablolar (ör. `decision_rules`, `dashboards`, `audit_log`, `api_keys`,
`backup_jobs`) ilgili modülün geliştirme oturumunda eklenecektir.

```mermaid
erDiagram
    USERS ||--o{ DATASETS : "yükler"
    USERS {
        uuid id PK
        string email
        string password_hash
        string role "admin | analist | izleyici"
        datetime created_at
    }
    DATASETS ||--o{ DATASET_COLUMNS : "içerir"
    DATASETS {
        uuid id PK
        uuid owner_id FK
        string name
        string source_table
        int row_count
        datetime uploaded_at
    }
    DATASET_COLUMNS {
        uuid id PK
        uuid dataset_id FK
        string name
        string dtype
    }
    DATASETS ||--o{ FORECAST_RUNS : "hedef alınır"
    FORECAST_RUNS {
        uuid id PK
        uuid dataset_id FK
        string method "SARIMA | Prophet | regression"
        float rmse
        float mae
        float mape
        string mlflow_run_id
        datetime created_at
    }
    FORECAST_RUNS ||--o{ RECOMMENDATIONS : "tetikler"
    RECOMMENDATIONS {
        uuid id PK
        uuid source_forecast_id FK
        string rule_id
        string message
        int priority_score
        datetime created_at
    }
```

## 4. Veri Akışı (Uçtan Uca Senaryo)

```mermaid
sequenceDiagram
    participant A as Analist (FE)
    participant API as Backend
    participant W as Celery Worker
    participant PG as PostgreSQL
    participant MLF as MLflow

    A->>API: CSV yükle (M01)
    API->>PG: şema + temizlenmiş veri yaz (M02)
    A->>API: analiz/tahmin başlat (M03/M04)
    API->>W: asenkron görev kuyruğa al
    W->>PG: veri oku
    W->>MLF: deney/parametre/metrik logla (M14)
    W->>PG: sonucu yaz
    API->>PG: kural motorunu çalıştır (M05)
    PG-->>API: öneri üret
    A->>API: dashboard'da görüntüle (M06)
```

## 5. Servis Portları (Yerel Geliştirme)

| Servis | Port | Not |
|---|---|---|
| frontend | 5173 | Vite dev server |
| backend | 8000 | FastAPI, `/docs` = OpenAPI (M09) |
| postgres | 5432 | |
| redis | 6379 | |
| redpanda | 9092 (Kafka API), 8081 (schema registry, kullanılmıyorsa kapatılabilir) | |
| mlflow | 5000 | |
| prometheus | 9090 | |
| grafana | 3000 | |
| mock_erp | 8001 | |

## 6. Açık Notlar

- Bu makinede Docker kurulu değil; `docker compose up` doğrulaması henüz
  yapılamadı. Bkz. `PLAN.md` § Bilinen Sorunlar.
- Prophet kurulum sorunlarına karşı SARIMA'ya düşme kuralı (FR-04-2, SOTA §4.3)
  bu diyagramlarda ayrıca gösterilmedi; `M04` servis katmanında try/fallback
  olarak uygulanacak.
