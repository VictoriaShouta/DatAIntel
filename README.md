# DatAIntel — Yapay Zeka Destekli Akıllı Veri Analitiği ve Tahmin Sistemi

Staj projesi (2 hafta / 10 iş günü, tek geliştirici + Claude Code). Kaynak Ar-Ge
önerisindeki 15 modülü (M01–M15) tek bir web uygulaması çatısı altında,
modüler monolit mimariyle hayata geçirir. Tüm veriler sentetiktir — gerçek
kurumsal veri kullanılmaz.

Kapsam, mimari ve modül seviyeleri için: [`CLAUDE.md`](./CLAUDE.md)
Günlük ilerleme ve bilinen sorunlar için: [`PLAN.md`](./PLAN.md)
Gereksinimler için: `docs/SRS.md`, teknoloji seçim gerekçeleri için: `docs/SOTA.md`
Mimari detay için: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

## Kurulum

Gereksinimler: Docker + Docker Compose, Git. Yerel geliştirme için ayrıca
Python 3.11+ ve Node.js 20 önerilir.

```bash
cp .env.example .env
docker compose up --build
```

Ayağa kalkan servisler ve portlar için `docker-compose.yml` ve
`docs/ARCHITECTURE.md` § "Servis Portları" bölümüne bakın.

## Sentetik veri üretimi

```bash
python scripts/generate_data.py
```

## Durum

Gün 2 — repo iskeleti, altyapı ve sentetik veri üreteci kuruluyor.
Detaylı ilerleme: [`PLAN.md`](./PLAN.md)
