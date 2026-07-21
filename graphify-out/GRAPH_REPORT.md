# Graph Report - /Users/ebrugokcek/Desktop/DatAIntel  (2026-07-21)

## Corpus Check
- Corpus is ~14,239 words - fits in a single context window. You may not need a graph.

## Summary
- 345 nodes · 460 edges · 38 communities (36 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.83)
- Token cost: 147,951 input · 0 output

## Community Hubs (Navigation)
- Proje Yönetişimi ve Devir Notları
- React Router Sayfa Ağacı
- Frontend Geliştirme Bağımlılıkları (Tailwind/TS/oxlint)
- Backend Çekirdek Altyapısı (config + db)
- Backend Teknoloji Yığını
- Frontend Çalışma Zamanı Bağımlılıkları (React/GSAP/Lenis)
- TypeScript Derleyici Ayarları (app)
- Sinematik Kabuk Bileşenleri (Layout/SmoothScroll)
- TypeScript Derleyici Ayarları (node/vite)
- 3D Nokta Bulutu Sahnesi (DataCloud/R3F)
- Sentetik Veri Üreteci (generate_data.py)
- Kök Paket Betikleri (npm delegasyonu)
- Backend Giriş Noktası ve Metrikler
- Marka ve Tipografi (index.html/fontlar/favicon)
- Sosyal İkon Seti (icons.svg)
- TypeScript Proje Referansları (kök tsconfig)
- Frontend API İstemcisi

## God Nodes (most connected - your core abstractions)
1. `DatAIntel Proje Durumu Kaydı (CLAUDE.md)` - 40 edges
2. `compilerOptions` - 18 edges
3. `10 Günlük İş Paketi Takvimi (Gün 1-10, modül→gün ataması)` - 16 edges
4. `compilerOptions` - 15 edges
5. `M02 — Veri depolama ve yönetim` - 13 edges
6. `Katman Şeması (Client / Uygulama / Veri / ML / İzleme / Yardımcı Servisler)` - 13 edges
7. `M10 — Kullanıcı yönetimi ve yetkilendirme` - 12 edges
8. `M04 — Tahmin ve öngörü` - 11 edges
9. `Backend Python Bağımlılıkları (fastapi, sqlalchemy, celery, redis, pandas, scikit-learn...)` - 11 edges
10. `M05 — Otomatik karar destek` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Sosyal/Nav İkon Sprite Sayfası (symbol tanımları, kullanım için <use>)` --conceptually_related_to--> `Ana Sayfa Yeniden Tasarımı (plan-dışı: Claude Design handoff reddedildi, 'AI slop' istenmedi, karar Claude Code'a bırakıldı; landonorris.com referanslı GSAP+Lenis+R3F deneyimi)`  [INFERRED]
  frontend/public/icons.svg → CLAUDE.md
- `WebGL Koruması (useWebglAvailable — donanım hızlandırma kapalıysa 3D katman mount edilmez)` --semantically_similar_to--> `Prophet Kurulum Sorunu → SARIMA'ya Düşme Kuralı (FR-04-2, SOTA §4.3)`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/ARCHITECTURE.md
- `index.html Giriş Sayfası (DatAIntel — Veriden karara)` --conceptually_related_to--> `Ana Sayfa Yeniden Tasarımı (plan-dışı: Claude Design handoff reddedildi, 'AI slop' istenmedi, karar Claude Code'a bırakıldı; landonorris.com referanslı GSAP+Lenis+R3F deneyimi)`  [INFERRED]
  frontend/index.html → CLAUDE.md
- `DatAIntel Mimari Doküman (ARCHITECTURE.md)` --references--> `DatAIntel Proje Durumu Kaydı (CLAUDE.md)`  [EXTRACTED]
  docs/ARCHITECTURE.md → CLAUDE.md
- `DatAIntel 10 Günlük Proje Planı (PLAN.md)` --references--> `Kapsam Kesme Sırası (M11→M13→M08→M15→M07; M01-M06+M10 asla kesilmez; karar geliştiricinindir)`  [EXTRACTED]
  PLAN.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Docker Compose 12-Servis Yığını (postgres, redis, redpanda, mlflow, prometheus, grafana, backend, worker, beat, frontend, mock_erp, stream_producer)** — docker_compose_postgres, docker_compose_redis, docker_compose_redpanda, docker_compose_mlflow, docker_compose_prometheus, docker_compose_grafana, docker_compose_backend, docker_compose_worker, docker_compose_beat, docker_compose_frontend, docker_compose_mock_erp, docker_compose_stream_producer [EXTRACTED 1.00]
- **RBAC'a (M10) Bağımlı Modüller Grubu** — claude_m01_veri_girisi_onisleme, claude_m02_veri_depolama_yonetim, claude_m03_gelismis_analitik, claude_m04_tahmin_ongoru, claude_m05_karar_destek, claude_m06_raporlama_gorsellestirme, claude_m07_gercek_zamanli_isleme, claude_m10_kullanici_yonetimi [EXTRACTED 1.00]
- **Footer Sosyal/Nav İkon Seti (Bluesky, Discord, Docs, GitHub, Social, X)** — frontend_public_icons_bluesky_icon, frontend_public_icons_discord_icon, frontend_public_icons_documentation_icon, frontend_public_icons_github_icon, frontend_public_icons_social_icon, frontend_public_icons_x_icon [INFERRED 0.80]

## Communities (38 total, 2 thin omitted)

### Community 0 - "Proje Yönetişimi ve Devir Notları"
Cohesion: 0.10
Nodes (45): Ana Sayfa Yeniden Tasarımı (plan-dışı: Claude Design handoff reddedildi, 'AI slop' istenmedi, karar Claude Code'a bırakıldı; landonorris.com referanslı GSAP+Lenis+R3F deneyimi), Modül Bağımlılık Kuralı (service.py tek yönlü import, router.py ASLA, yüksek→düşük numara), Çalışma Protokolü (onay-bekle, bir seferde bir modül, PLAN.md güncelle), DatAIntel Platformu (AI Destekli Akıllı Veri Analitiği ve Tahmin Sistemi), GitHub Reposu (github.com/VictoriaShouta/DatAIntel, main dalı), graphify-out Sorgu Önceliği (yeni oturumda dosyaları baştan okumadan önce bilgi grafiğini sorgula), Kapsam Kesme Sırası (M11→M13→M08→M15→M07; M01-M06+M10 asla kesilmez; karar geliştiricinindir), Kod Konvansiyonları (PEP8, Türkçe docstring, İngilizce isim) (+37 more)

### Community 1 - "React Router Sayfa Ağacı"
Cohesion: 0.08
Nodes (19): App(), queryClient, LoginPage(), AnalyticsPage(), ApiIntegrationPage(), BackupPage(), DecisionSupportPage(), ErpIntegrationPage() (+11 more)

### Community 2 - "Frontend Geliştirme Bağımlılıkları (Tailwind/TS/oxlint)"
Cohesion: 0.06
Nodes (30): devDependencies, oxlint, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, @types/three (+22 more)

### Community 3 - "Backend Çekirdek Altyapısı (config + db)"
Cohesion: 0.08
Nodes (14): get_settings(), Uygulama ayarları — ortam değişkenlerinden Pydantic Settings ile okunur., Settings, Base, get_db(), SQLAlchemy engine ve session yönetimi., Uygulama genelinde tutarlı log formatı için merkezi kurulum., setup_logging() (+6 more)

### Community 4 - "Backend Teknoloji Yığını"
Cohesion: 0.12
Nodes (27): Backend Python Bağımlılıkları (fastapi, sqlalchemy, celery, redis, pandas, scikit-learn...), Celery (worker + beat), FastAPI (Backend, Python 3.11+), JWT Kimlik Doğrulama (python-jose + passlib/bcrypt; admin/analist/izleyici), İzleme Yığını (prometheus-fastapi-instrumentator + Prometheus + Grafana; M13), PostgreSQL 16 + SQLAlchemy 2.0 + Alembic, Redis (Celery broker + result backend + rate limit), Redpanda (Kafka API uyumlu, Zookeeper yok; M07) (+19 more)

### Community 5 - "Frontend Çalışma Zamanı Bağımlılıkları (React/GSAP/Lenis)"
Cohesion: 0.08
Nodes (25): axios, dependencies, axios, gsap, @gsap/react, lenis, react, react-dom (+17 more)

### Community 6 - "TypeScript Derleyici Ayarları (app)"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 7 - "Sinematik Kabuk Bileşenleri (Layout/SmoothScroll)"
Cohesion: 0.16
Nodes (14): Layout(), PHASE_ORDER, SmoothScroll(), ModuleEntry, ModulePhase, MODULES, PHASE_LABELS, PRIMARY_NAV (+6 more)

### Community 8 - "TypeScript Derleyici Ayarları (node/vite)"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 9 - "3D Nokta Bulutu Sahnesi (DataCloud/R3F)"
Cohesion: 0.24
Nodes (10): Cloud(), CloudProps, COLD, WARM, barsStage(), createDataCloudGeometry(), focusStage(), gridStage() (+2 more)

### Community 10 - "Sentetik Veri Üreteci (generate_data.py)"
Cohesion: 0.38
Nodes (10): DataFrame, generate_customers(), generate_finance(), generate_inventory(), generate_products(), generate_sales(), inject_dirty_records(), main() (+2 more)

### Community 11 - "Kök Paket Betikleri (npm delegasyonu)"
Cohesion: 0.18
Nodes (10): description, name, private, scripts, build, dev, lint, postinstall (+2 more)

### Community 12 - "Backend Giriş Noktası ve Metrikler"
Cohesion: 0.24
Nodes (5): Prometheus izleme kurulumu (M13, FR-13-1)., setup_metrics(), DatAIntel backend — FastAPI uygulaması.  Router kayıtları modül geliştirme ilerl, FastAPI, mock_erp — sentetik ERP verisi servis eden yardımcı FastAPI uygulaması.  Gün 8'd

### Community 13 - "Marka ve Tipografi (index.html/fontlar/favicon)"
Cohesion: 0.29
Nodes (7): Frontend Yığını (React + Vite + Tailwind + Recharts + TanStack Query), Bricolage Grotesque Fontu, index.html Giriş Sayfası (DatAIntel — Veriden karara), Instrument Sans Fontu, JetBrains Mono Fontu, DatAIntel Favicon/Marka İşareti (mor poligon ok/yıldırım formu, mor-lila-mavi gradyan glow blob'ları, şeffaf zemin), main.tsx (React giriş betiği, index.html'den referans edilir)

### Community 14 - "Sosyal İkon Seti (icons.svg)"
Cohesion: 0.29
Nodes (7): Bluesky İkonu, Discord İkonu, Dokümantasyon İkonu (kitap/sayfa çizgi ikonu, mor stroke), GitHub İkonu, Sosyal/Nav İkon Sprite Sayfası (symbol tanımları, kullanım için <use>), Genel Sosyal/Profil İkonu (kişi + rozet, mor stroke), X (Twitter) İkonu

## Knowledge Gaps
- **104 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Frontend Çalışma Zamanı Bağımlılıkları (React/GSAP/Lenis)` to `Frontend Geliştirme Bağımlılıkları (Tailwind/TS/oxlint)`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `lenis` connect `Frontend Çalışma Zamanı Bağımlılıkları (React/GSAP/Lenis)` to `Sinematik Kabuk Bileşenleri (Layout/SmoothScroll)`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `SmoothScroll()` connect `Sinematik Kabuk Bileşenleri (Layout/SmoothScroll)` to `Frontend Çalışma Zamanı Bağımlılıkları (React/GSAP/Lenis)`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Proje Yönetişimi ve Devir Notları` be split into smaller, more focused modules?**
  _Cohesion score 0.10404040404040404 - nodes in this community are weakly interconnected._
- **Should `React Router Sayfa Ağacı` be split into smaller, more focused modules?**
  _Cohesion score 0.07823613086770982 - nodes in this community are weakly interconnected._
- **Should `Frontend Geliştirme Bağımlılıkları (Tailwind/TS/oxlint)` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._