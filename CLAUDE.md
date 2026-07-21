# DatAIntel — AI Destekli Akıllı Veri Analitiği ve Tahmin Sistemi

## Bağlam

Staj projesi. Süre: **2 hafta / 10 iş günü**. Geliştirici: tek kişi + Claude Code.
Kaynak doküman bir Ar-Ge proje önerisidir (TÜBİTAK tarzı) ve **15 modül** tanımlar.
Amaç: bu 15 modülün tamamını **tek bir web uygulaması** çatısı altında çalışır halde sunmak.

**Veri:** Gerçek veri yok. Tüm veriler `scripts/generate_data.py` ile üretilen sentetik
verilerdir (satış / stok / finans temalı; trend + mevsimsellik + gürültü + kasıtlı kirli
kayıtlar içerir, çünkü M01'in ön işleme yeteneğinin gösterilecek bir şeye ihtiyacı var).

**Kapsam felsefesi:** Altyapı gerçek, modüller dürüst. Grup D modülleri PoC seviyesinde
kalır ama gerçek altyapı üzerinde çalışır — sahte ekran yok, her şey gerçekten çalışır.

## Mimari

**Modüler monolit** + iki yardımcı servis (mock ERP, stream üreteci). Mikroservise bölme YOK.

```
datAIntel/
├── docker-compose.yml       # postgres, redis, redpanda, mlflow, prometheus, grafana,
│                            # backend, worker, frontend, mock-erp, stream-producer
├── backend/
│   ├── main.py              # FastAPI app, router kayıtları, middleware
│   ├── core/                # config, db, auth, security, logging, metrics
│   ├── modules/
│   │   ├── m01_ingest/      # her modül: router.py service.py schemas.py models.py tasks.py
│   │   ├── m02_storage/
│   │   └── ...              # m01 .. m15
│   ├── worker/              # Celery app + task kayıtları
│   ├── migrations/          # Alembic
│   └── tests/
├── frontend/                # React + Vite + Tailwind; her modül için bir sayfa
│   └── src/pages/
├── services/
│   ├── mock_erp/            # ayrı FastAPI servisi: satış, stok, finans, İK endpoint'leri
│   └── stream_producer/     # Redpanda'ya sürekli olay basan üreteç
├── scripts/generate_data.py
├── docs/                    # SOTA.md SRS.md ARCHITECTURE.md USER_GUIDE.md FUTURE.md
├── PLAN.md                  # 10 günlük plan + ilerleme takibi (her oturumda oku)
└── CLAUDE.md                # bu dosya
```

**Bağımlılık kuralı:** Bir modül başka bir modülün `service.py`'sini import edebilir,
`router.py`'sini ASLA. Bağımlılık tek yönlü: yüksek numara → düşük numara.

## Stack

| Katman | Seçim | Not |
|---|---|---|
| Backend | FastAPI, Python 3.11+ | Otomatik OpenAPI = M09'un dokümantasyonu bedava |
| DB | **PostgreSQL 16** + SQLAlchemy 2.0 + Alembic | Docker Compose ile |
| Cache/Broker | **Redis** | Celery broker + sonuç backend + rate limit |
| Async iş | **Celery** worker + beat | Model eğitimi, yedekleme, rapor üretimi, zamanlanmış işler |
| Stream | **Redpanda** (Kafka API uyumlu) | Tek container, Zookeeper yok; M07 |
| ML | pandas, scikit-learn, statsmodels; opsiyonel Prophet | Prophet kurulumda sorun çıkarırsa SARIMA'ya düş, zaman kaybetme |
| Model kayıt | **MLflow** | M14: deney takibi, model versiyonlama, metrik karşılaştırma |
| Frontend | React + Vite + Tailwind + Recharts + TanStack Query | |
| Realtime UI | WebSocket (FastAPI) — Redpanda consumer → WS köprüsü | |
| Auth | JWT (python-jose) + passlib/bcrypt | Roller: admin / analist / izleyici |
| İzleme | **prometheus-fastapi-instrumentator** + Prometheus + Grafana | M13 |
| Test | pytest, httpx, testcontainers (gerekirse), Locust (yük) | |

**Kural:** Her şey `docker compose up` ile ayağa kalkar. "Bende çalışıyor" kabul edilmez.

## 15 Modül ve Hedef Seviyeler

| # | Modül | Grup | Seviye | Ana teknoloji |
|---|---|---|---|---|
| M01 | Veri girişi ve ön işleme | A | Tam | pandas, upload, temizleme profilleri |
| M02 | Veri depolama ve yönetim | A | Tam | Postgres, meta veri kataloğu, indeksleme |
| M03 | Gelişmiş analitik | B | Tam | istatistik, korelasyon, K-Means, sınıflandırma |
| M04 | Tahmin ve öngörü | B | Tam | zaman serisi (SARIMA/Prophet), regresyon |
| M05 | Otomatik karar destek | B | Tam | kural motoru + eşikler + öneri üretimi |
| M06 | Dinamik raporlama ve görselleştirme | B | Tam | dashboard oluşturucu, PDF/Excel dışa aktarım |
| M07 | Gerçek zamanlı veri işleme | C | Tam | Redpanda → consumer → WebSocket → canlı grafik |
| M08 | Veri güvenliği ve gizlilik | D | PoC | alan şifreleme, maskeleme, erişim/denetim logu |
| M09 | API ve entegrasyon | C | Tam | API key, rate limit, OpenAPI, webhook |
| M10 | Kullanıcı yönetimi ve yetkilendirme | A | Tam | JWT, RBAC |
| M11 | Dinamik güncelleme ve bakım | D | PoC | sürüm bilgisi, bakım modu, changelog, migration durumu |
| M12 | Veri yedekleme ve kurtarma | D | PoC | Celery beat + `pg_dump` / `pg_restore` arayüzü |
| M13 | Performans izleme ve optimizasyon | D | PoC | Prometheus metrikleri + Grafana + uygulama içi panel |
| M14 | AI model eğitimi ve güncelleme | C | Tam | MLflow, yeniden eğitme görevi, metrik karşılaştırma |
| M15 | ERP entegrasyonu | D | PoC | mock ERP servisi → veri çekme → analitikle birleştirme |

"PoC" = kavramın gerçekten çalıştığını gösteren en küçük dürüst implementasyon.
Sahte ekran, hardcode sonuç, "yapılmış gibi" gösterim YASAK.

## Çalışma Protokolü

1. **Her oturum başında `PLAN.md` oku.** Hangi gündeyiz, ne bitti, sıradaki ne?
2. **Bir seferde bir modül.** Bitmeden diğerine geçme.
3. **Modül sırası:** models → schemas → service → (tasks) → router → frontend sayfası → test → PLAN.md işaretle.
4. **Kod yazmadan önce ne yapacağını 3-5 maddede söyle, onay bekle.** Onay gelmeden dosya oluşturma.
5. **Her modül bitiminde:** çalıştığını kanıtlayan komut/istek örneği ver, PLAN.md güncelle, commit at.
6. **Gün sonunda** o günün `docs/` çıktısını yaz — staj raporu kendiliğinden birikmeli.
7. Bir şey çalışmıyorsa gizleme; PLAN.md'nin "Bilinen sorunlar" bölümüne yaz.

## Kod Konvansiyonları

- Python: PEP8, type hint zorunlu, docstring'ler **Türkçe** (staj raporuna gidecek).
- Kod isimleri İngilizce; yorumlar ve UI metinleri Türkçe.
- Servis fonksiyonları saf: DB session parametre olarak gelir, global state yok.
- Hata yönetimi: servis katmanı domain exception fırlatır, router HTTPException'a çevirir.
- Ayarlar `core/config.py` içinde Pydantic Settings ile; `.env.example` güncel tutulur.
- Her şema değişikliği bir Alembic migration'ı ile gelir.
- Frontend: sayfa başına tek dosya, ortak bileşenler `src/components/`.
- Sentetik veri üreteci dışında hiçbir yere sabit veri gömme.

## Sınırlar

- Kapsam dışı fikirler `docs/FUTURE.md`'ye not düşülür, plana sokulmaz.
- Süre baskısı olursa **kesme sırası:** M11 → M13 → M08 → M15 → M07.
  **M01–M06 ve M10 asla kesilmez.**
- Kapsam kesme kararını sen alma, öner; karar geliştiricinindir.

---

## Gün 1 Durumu ve Claude Code'a Devir

**Son güncelleme:** 17.07.2026 — Gün 1 tamamlandı, geliştirme buradan itibaren Claude Code ile sürdürülecek.

### Gün 1'de ne yapıldı (kod öncesi doküman aşaması)

İş Paketi 1 çıktıları bir sohbet oturumunda üretildi ve geliştiriciye teslim edildi:

- **`docs/SOTA.md`** — Teknolojinin ulaştığı mevcut durum. Dört alan (BI platformları, AutoML/model yaşam döngüsü, zaman serisi tahmini, gerçek zamanlı işleme), karşılaştırma tablosu, üç yapısal boşluk analizi, teknoloji seçimi gerekçeleri. (Word sürümü: `DatAIntel_SOTA.docx`, hazırlayan: Ebru Gökçek.)
- **`docs/SRS.md`** — Yazılım gereksinimleri. Persona (1.2) ve donanım (1.3) ayrı dosya değil, SRS içine bölüm olarak konuldu. M01–M15 için `FR-<modül>-<sıra>` gereksinimleri, NFR'ler, izlenebilirlik matrisi (modül → İP-3 faaliyeti → FR → SOTA boşluğu → seviye), kısıtlar/varsayımlar.

Bu iki doküman `docs/` altına geliştirici tarafından yerleştirilecektir.

### Repo ve ortam durumu

- **Repo henüz açılmadı.** GitHub reposu geliştirici tarafından açılacak; `git init` + `git remote` bağlanacak.
- **Ana Word dokümanı (`DatAIntel.docx`) repoya girmeyecek.** `.gitignore`'a `*.docx` eklenmeli (kaynak öneri ve SOTA'nın Word sürümü repoda tutulmaz; yalnızca geliştiricinin elinden çıkan kod ve markdown dokümanlar repoda durur).
- Ağ erişimi olmayan bir ortamda çalışıldığı için önceki oturumda `docker compose up`, `git push` vb. çalıştırılamadı. Bunlar Claude Code'da fiilen yürütülecek.

### Claude Code için ilk oturum (Gün 2) yönergesi

1. Bu dosyayı ve `PLAN.md`'yi oku; Gün 2 kutularından başla.
2. Çalışma Protokolü madde 4 geçerli: **kod yazmadan önce ne yapılacağını 3-5 maddede söyle, onay bekle.**
3. Gün 2 hedefi: repo iskeleti + `docker-compose.yml` + FastAPI/frontend kabukları + `scripts/generate_data.py` + `docs/ARCHITECTURE.md`. Her şey `docker compose up` ile ayağa kalkmalı.
4. `docs/SOTA.md` ve `docs/SRS.md` mevcut varsayılır; ARCHITECTURE.md bunlara referans versin, tekrar üretmesin.
5. `PLAN.md` "Bilinen Sorunlar" bölümünde Gün 1'den devreden iki açık madde var (SOTA kaynak doğrulaması, ürün bilgisi tazeliği); bunlar rapor teslimi öncesi geliştirici görevidir, Gün 2'yi bloklamaz.

### Bu ortam ile Claude Code arasındaki iş bölümü

- **Sohbet oturumu (bu ortam):** kod öncesi dokümanlar, planlama, gereksinim yazımı. Dosya sistemine kalıcı yazma ve komut çalıştırma yok.
- **Claude Code:** repo, Docker, migration, commit, test döngüsü — CLAUDE.md'deki Çalışma Protokolü'nün fiilen işlediği yer.

---

## Gün 3'e Devir

**Son güncelleme:** 21.07.2026 — Gün 2 tamamlandı ve doğrulandı; ayrıca kapsam dışı bir ana sayfa/görsel tasarım turu yapıldı. Gün 3 (M10 + M01 + M02) henüz başlamadı.

### Gün 2'den bu yana ne değişti (Gün 3'ü bloklamıyor ama bilinmesi gerekir)

- **Ana sayfa artık tasarımlı — plan dışı, ayrı bir talep üzerine.** Kullanıcı önce Claude Design ile bir header/hero handoff'u denedi, beğenmedi ("AI slop" gibi durmasın istedi), sonrasında tasarım kararlarını doğrudan Claude Code'a bıraktı. `frontend/src/pages/HomePage.tsx` ve `frontend/src/components/Layout.tsx` artık landonorris.com referanslı, scroll tabanlı, GSAP + Lenis + React Three Fiber ile kurulu bitmiş bir deneyim (karbon zemin, soğuk camgöbeği → sıcak amber anlatısal renk ekseni, 3D nokta bulutu morph'u, yatay kayan modül galerisi). **Bu iş Gün 3-10 modül planının bir parçası değildi**, üstüne eklendi — dolayısıyla `PLAN.md`'deki modül kutularını etkilemez.
- **`frontend/src/pages/modules/*.tsx` hâlâ Gün 2'deki gibi tasarımsız kabuk durumda** ("Gün 3 kapsamında eklenecek" placeholder metniyle). Gün 3'te M10/M01/M02 sayfaları buradan gerçek içerikle doldurulacak; ana sayfanın görsel diliyle (karbon/kemik/camgöbeği-amber, Bricolage Grotesque + Instrument Sans + JetBrains Mono) tutarlı olmalı, ama modül sayfalarına 3D sahne/scroll pinleme TAŞINMAYACAK — o yalnızca ana sayfaya özgü.
- **Kökte ince bir `package.json` eklendi** (`postinstall` → `frontend/`'e devreder, `dev`/`build`/`preview`/`lint` scriptleri de öyle). VS Code'da klasör kökünde `npm install` / `npm run dev` artık çalışıyor; gerçek bağımlılıklar hâlâ yalnızca `frontend/package.json`'da.
- **WebGL koruması eklendi** (`frontend/src/lib/motion.ts` → `useWebglAvailable`): donanım hızlandırması kapalı tarayıcılarda (ör. bazı Opera GX yapılandırmaları) 3D katman hiç mount edilmiyor, sayfa metin/scroll deneyimi olarak eksiksiz kalıyor. `prefers-reduced-motion` için de aynı desen zaten vardı.
- Repo GitHub'a push edildi: `github.com/VictoriaShouta/DatAIntel`, `main` dalı güncel.
- **`graphify-out/`** eklendiyse (bkz. proje köküne bakın) kod/doküman üzerinde sorgulanabilir bir bilgi grafiği var — yeni bir oturumda "X nerede/nasıl çalışıyor" gibi bir soru geldiğinde önce onu sorgulamak, ilgili dosyaları baştan sona okumaktan daha ucuzdur.

### Gün 3 için ilk oturum yönergesi

1. `PLAN.md`'yi oku, "Gün 3" bölümünden başla: M10 (kullanıcı yönetimi) → M01 (veri girişi) → M02 (veri depolama).
2. Çalışma Protokolü madde 3 geçerli: her modülde sıra **models → schemas → service → (tasks) → router → frontend sayfası → test → PLAN.md işaretle**.
3. Çalışma Protokolü madde 4 geçerli: **kod yazmadan önce ne yapılacağını 3-5 maddede söyle, onay bekle.**
4. `backend/modules/m01..m15` klasörleri Gün 2'de iskelet olarak açıldı ama içleri boş; Gün 3 bunları gerçek modüllerle dolduracak ilk gün.
5. Frontend tarafında modül sayfası şablonu henüz yok — M10/M01/M02 sayfalarını yazarken ortak bir düzen (başlık bloğu, içerik kabı) türetmek isterse bu üç modülden sonra ayrı bir adım olarak ele alınabilir; Gün 3'ü bloklamaz.
