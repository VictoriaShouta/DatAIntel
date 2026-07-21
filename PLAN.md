# DatAIntel — 10 Günlük Proje Planı

> Bu dosya hem plan hem ilerleme takibidir. Her modül bitiminde kutular işaretlenir.
> Kalıcı kurallar ve mimari için `CLAUDE.md`'ye bakın.

**Durum:** Gün 2 tamamlandı — Gün 3'e hazır (M10 + M01 + M02 henüz başlamadı)
**Son güncelleme:** 21.07.2026 — ayrıca bkz. `CLAUDE.md` → "Gün 3'e Devir" (ana sayfa tasarımı, WebGL koruması, kök npm scriptleri, GitHub push — bunlar Gün 3 modül planının dışında, üstüne eklendi)

> **Plan dışı not (21.07.2026, Gün 3 başlamadan önce):** Ana sayfaya alche.studio
> referanslı, GSAP ScrollTrigger tabanlı çapraz bir hero-çıkış efekti eklendi —
> hero, ekstra bir 80vh'lik "koşu pisti" boyunca sticky kalıp sağ-üst yönde
> `xPercent`/`yPercent`/`rotate`/`scale` ile ivmelenerek sahneden ayrılıyor,
> arkasında zaten sabit duran DataCloud (3D nokta bulutu, `z-0`, tüm sayfa
> boyunca fixed) ve boru hattı bölümü pürüzsüzce ortaya çıkıyor. Mevcut boru
> hattı bölümündeki desenle aynı yaklaşım kullanıldı (GSAP `pin:true` değil,
> sticky + scrub — Lenis ile bilinen uyumsuzluktan kaçınmak için). Ayrıca site
> genelinde kullanıcıya görünen "modül" kelimesi ve `M01` gibi kod rozetleri
> kaldırıldı (geliştiricinin tercihiyle: şemsiye kelime yok, sadece isimle
> anlatım — `frontend/src/lib/modules.ts`, `HomePage.tsx`, `Layout.tsx`). Bu iş
> Gün 3'ün M10/M01/M02 hedefinin bir parçası değil, üstüne eklendi; modül
> kutularını etkilemiyor.

> **Plan dışı not (21.07.2026, devamı):** alche.studio referans alınarak site
> geneline özel imleç eklendi (`components/Cursor.tsx` — nokta + gecikmeli
> halka, `[data-cursor-hover]` işaretli öğelerde büyüyüp sıcak renge dönüyor;
> dokunmatik/hareket azaltmada hiç kurulmuyor). "On beş durak, tek hat"
> galerisindeki her karta modül koduna göre sabit üretilen soyut bir kapak
> eklendi (`components/ModuleCover.tsx` — marka işaretindeki yükselen nokta
> motifinin varyasyonu; gerçek ekran görüntüsü yerine, henüz modül sayfaları
> dolmadığı için). Kart üzerine gelindiğinde imleci izleyen, hafif 3B eğilen
> bir önizleme paneli beliriyor (`components/GalleryPreview.tsx`). Var olan
> yatay-kaydırmalı galeri iskeleti korundu, üzerine eklendi — yeniden
> yazılmadı. Not: bu üç bileşenin canlı imleç-takip/eğim/nefes animasyonları
> önizleme tarayıcısında piksel olarak doğrulanamadı (sekme `document.hidden`
> olduğu için `requestAnimationFrame` durmuş durumda — GSAP ticker'ı
> etkileyen bir sandbox kısıtı, kodun kendisiyle ilgisi yok); `npm run dev`
> ile gerçek tarayıcıda görsel olarak kontrol edilmeli.

---

## HAFTA 1

### Gün 1 — SOTA Araştırması ve Gereksinim Analizi
Kod yok. Bu gün, İş Paketi 1'in karşılığı ve staj raporunun omurgası.

- [x] **1.1 SOTA dokümanı** (`docs/SOTA.md`, ~6-10 sayfa)
  - [x] Veri analitiği platformları: Power BI, Tableau, Apache Superset, Metabase — mimari karşılaştırma
  - [x] AutoML / ML araçları: H2O, PyCaret, MLflow — model yaşam döngüsü yaklaşımları
  - [x] Zaman serisi tahmini: ARIMA/SARIMA, Prophet, LSTM — güçlü/zayıf yönler
  - [x] Gerçek zamanlı işleme: Kafka/Redpanda, Flink, Spark Streaming
  - [x] Karşılaştırma tablosu + DatAIntel'in konumlandırması (boşluk analizi)
- [x] **1.2 Kullanıcı gereksinimleri** — 3 persona (yönetici, veri analisti, IT yöneticisi), use-case listesi → `docs/SRS.md` Bölüm 3
- [x] **1.3 Donanım/altyapı gereksinimleri** — geliştirme ve varsayımsal üretim ortamı → `docs/SRS.md` Bölüm 4
- [x] **1.4 Yazılım Gereksinimleri Dokümanı** (`docs/SRS.md`)
  - [x] Fonksiyonel gereksinimler: her modül için FR-XX maddeleri (izlenebilirlik matrisi ile)
  - [x] Fonksiyonel olmayan: performans, güvenlik, KVKK/GDPR, kullanılabilirlik
  - [x] Kısıtlar ve varsayımlar (sentetik veri, tek geliştirici, 2 hafta)

**Çıktı:** `docs/SOTA.md` ✅, `docs/SRS.md` ✅

> **Not:** SOTA ve SRS bu sohbet oturumunda üretildi (kod öncesi doküman aşaması).
> Persona (1.2) ve donanım (1.3) ayrı dosya değil, SRS içine bölüm olarak konuldu.
> `docs/` klasörüne yerleştirme ve repoya ekleme geliştirici tarafından yapılacak.
> Gün 2'den itibaren geliştirme Claude Code ile sürdürülecek (bkz. `CLAUDE.md` → "Gün 1 Durumu ve Claude Code'a Devir").

---

### Gün 2 — Mimari, Altyapı ve Sentetik Veri
- [x] `docs/ARCHITECTURE.md`: katman şeması, ER diyagramı, modül bağımlılık grafiği, veri akışı, servis portları
- [x] Repo iskeleti (`git init`) + `requirements.txt` + `.env.example` + `.gitignore` + `README.md`
- [x] `docker-compose.yml`: postgres, redis, redpanda, mlflow, prometheus, grafana, backend, worker, beat, frontend, mock_erp, stream_producer — **12 servis de gerçekten ayakta ve doğrulandı** (bkz. aşağıdaki madde)
- [x] FastAPI iskeleti + `/health` + `/metrics` + `core/config.py` + `core/db.py` + `core/security.py` + `core/logging.py` + Alembic init — geçici venv'de gerçek import + TestClient ile doğrulandı
- [x] Frontend iskeleti (Vite 8 + React 19 + Tailwind v4 + React Router + TanStack Query + Recharts v3); M01–M15 için boş sayfa kabukları + Layout/nav. `npm run build` ve tarayıcıda routing doğrulandı. (Ana sayfa/header sonradan, Gün 3 dışında ayrı bir turda tasarlandı — bkz. not aşağıda; M01-M15 modül sayfaları hâlâ bu günkü tasarımsız kabuk haliyle duruyor, Gün 3'te dolduruluyor.)
- [x] **`scripts/generate_data.py`** — 2 yıllık (730 gün) satış/stok/finans/müşteri verisi; trend + haftalık/yıllık mevsimsellik + gürültü; ~%5 kasıtlı kirli kayıt (eksik değer, aykırı değer, tip hatası, duplikasyon) — çalıştırıldı ve dört kirli kayıt tipi de doğrulandı (`data/synthetic/`, gitignore'da — script ile yeniden üretilebilir)
- [x] `docker compose up` ile her şey ayağa kalkıyor ✔ — Docker kurulduktan sonra doğrulandı: `backend` `/health`+`/docs`, `mock_erp` `/health`, `mlflow`, `prometheus`, `grafana`, `frontend` 200 döndü; `worker`/`beat` Redis'e bağlandı; `postgres`/`redis` healthy. İki port çakışması (postgres/mlflow) ve iki VM-seviyesi bind-mount kilitlenmesi (postgres/prometheus) çözüldü — detay `docs/ARCHITECTURE.md` § Açık Notlar.

**Çıktı:** Repo iskeleti, docker-compose.yml (12 servis çalışır durumda doğrulandı), backend/frontend kabukları, sentetik veri üreteci.

> **Not (frontend iş bölümü — güncel):** Kullanıcı önce ana sayfa/header'ı Claude
> Design ile denedi, çıktıyı beğenmedi ve tasarım kararını doğrudan Claude Code'a
> bıraktı. Ana sayfa (`HomePage.tsx`, `Layout.tsx`) landonorris.com referanslı,
> GSAP + Lenis + React Three Fiber ile scroll tabanlı bir deneyim olarak
> tamamlandı — bu iş **Gün 3-10 modül planının parçası değildi**, plan dışı ayrı
> bir talepti. M01-M15 modül sayfaları (`frontend/src/pages/modules/`) bundan
> etkilenmedi, hâlâ tasarımsız kabuk halinde ve Gün 3'ün gerçek işi bunları
> doldurmak. Detay: `CLAUDE.md` → "Gün 3'e Devir".

---

### Gün 3 — M10 + M01 + M02 (Veri Omurgası)
- [ ] **M10 — Kullanıcı yönetimi ve yetkilendirme**
  - [ ] Kullanıcı modeli, kayıt/giriş, JWT üretimi ve doğrulama
  - [ ] RBAC: admin / analist / izleyici; `require_role` bağımlılığı
  - [ ] Frontend: giriş sayfası, korumalı rota, kullanıcı listesi (admin)
- [ ] **M01 — Veri girişi ve ön işleme**
  - [ ] CSV/Excel/JSON yükleme, şema çıkarımı, önizleme
  - [ ] Temizleme: eksik değer stratejileri, aykırı değer (IQR/z-score), tip dönüşümü, duplikasyon
  - [ ] Frontend: yükleme ekranı + temizleme seçenekleri + öncesi/sonrası karşılaştırma
- [ ] **M02 — Veri depolama ve yönetim**
  - [ ] Veri seti kataloğu (meta veri: satır/sütun sayısı, tipler, yükleme zamanı, sahip)
  - [ ] Postgres'e dinamik tablo yazımı, indeksleme, sürümleme
  - [ ] Frontend: veri seti listesi, detay, silme, örnek görüntüleme

---

### Gün 4 — M03 (Gelişmiş Analitik)
- [ ] Tanımlayıcı istatistikler + dağılım analizi
- [ ] Korelasyon matrisi (Pearson/Spearman)
- [ ] Kümeleme: K-Means + elbow yöntemi ile k önerisi
- [ ] Sınıflandırma: Random Forest / Logistic Regression + confusion matrix, ROC
- [ ] Uzun süren analizler Celery görevi olarak, ilerleme takibiyle
- [ ] Frontend: sütun seçimi → analiz tipi → sonuç görselleştirme

---

### Gün 5 — M04 (Tahmin ve Öngörü)
- [ ] Zaman serisi: SARIMA (temel), Prophet (kurulum sorunsuzsa)
- [ ] Regresyon modelleri (çok değişkenli)
- [ ] Tahmin doğruluk metrikleri: RMSE, MAE, MAPE + geriye dönük test (backtesting)
- [ ] Güven aralıklı tahmin çıktısı
- [ ] Frontend: tarih sütunu + hedef seç → N periyot tahmini → geçmiş+tahmin grafiği

---

## HAFTA 2

### Gün 6 — M05 + M06 (Karar Destek ve Raporlama)
- [ ] **M05 — Otomatik karar destek**
  - [ ] Kural motoru: kullanıcı tanımlı eşikler + tetikleyiciler
  - [ ] M03/M04 sonuçlarından öneri üretimi ("stok X gün içinde kritik seviyeye düşecek")
  - [ ] Öneri geçmişi ve öncelik skorlaması
  - [ ] Frontend: kural tanımlama ekranı + öneri akışı
- [ ] **M06 — Dinamik raporlama ve görselleştirme**
  - [ ] Dashboard oluşturucu (widget ekle/çıkar/düzenle, düzen kaydetme)
  - [ ] Grafik tipleri: çizgi, bar, dağılım, ısı haritası, pasta
  - [ ] PDF ve Excel dışa aktarım (Celery görevi)
  - [ ] Rapor şablonları

---

### Gün 7 — M07 + M14 (Gerçek Zamanlı ve Model Yaşam Döngüsü)
- [ ] **M07 — Gerçek zamanlı veri işleme**
  - [ ] `services/stream_producer`: Redpanda'ya sürekli olay basar (satış/sensör olayları)
  - [ ] Backend consumer → pencereli toplama (windowed aggregation) → WebSocket yayını
  - [ ] Anomali tespiti (basit eşik/z-score) → canlı uyarı
  - [ ] Frontend: canlı güncellenen grafik + olay akışı
- [ ] **M14 — AI model eğitimi ve güncelleme**
  - [ ] MLflow entegrasyonu: deney kaydı, parametre/metrik loglama
  - [ ] Model kayıt defteri, versiyonlama, aşama etiketleri (staging/production)
  - [ ] Celery ile yeniden eğitme görevi + zamanlanmış eğitim (beat)
  - [ ] Frontend: model listesi, versiyon karşılaştırma, "yeniden eğit" butonu

---

### Gün 8 — M09 + M15 + M08
- [ ] **M09 — API ve entegrasyon**
  - [ ] API key üretimi/iptali, key bazlı kimlik doğrulama
  - [ ] Redis ile rate limiting
  - [ ] OpenAPI dokümantasyonunun zenginleştirilmesi, webhook desteği
- [ ] **M15 — ERP entegrasyonu (PoC)**
  - [ ] `services/mock_erp`: satış, tedarik, envanter, finans, İK endpoint'leri (sentetik veri servis eder)
  - [ ] Bağlayıcı (connector): periyodik veri çekme → M02'ye yazma
  - [ ] ERP verisinin analitik/tahmin sonuçlarıyla birleştirilmesi → operasyonel rapor
  - [ ] Frontend: ERP bağlantı durumu + senkronizasyon geçmişi
- [ ] **M08 — Veri güvenliği ve gizlilik (PoC)**
  - [ ] Hassas alan şifreleme (uygulama seviyesi) + maskeleme/anonimleştirme
  - [ ] Denetim (audit) logu: kim, ne zaman, hangi veriye erişti
  - [ ] Frontend: denetim logu görüntüleyici

---

### Gün 9 — M11 + M12 + M13 + Test
- [ ] **M11 — Dinamik güncelleme ve bakım (PoC):** sürüm bilgisi, bakım modu anahtarı (middleware), changelog, migration durumu
- [ ] **M12 — Veri yedekleme ve kurtarma (PoC):** Celery beat ile zamanlanmış `pg_dump`, yedek listesi, tek tıkla geri yükleme, doğrulama
- [ ] **M13 — Performans izleme (PoC):** Prometheus metrikleri, Grafana panosu, uygulama içi özet panel (istek süreleri, hata oranı, kaynak kullanımı)
- [ ] **Testler:** pytest birim + entegrasyon testleri, kritik akışların uçtan uca testi
- [ ] Locust ile temel yük testi + sonuç raporu

---

### Gün 10 — Test Tamamlama, Dokümantasyon, Demo
- [ ] Güvenlik kontrol listesi (OWASP Top 10 temel geçiş) + `docs/SECURITY_TEST.md`
- [ ] Kullanıcı kabul senaryoları (5-6 senaryo) yürütülüp raporlanır
- [ ] `docs/USER_GUIDE.md` — ekran görüntüleriyle
- [ ] `README.md` — kurulum, çalıştırma, mimari özet
- [ ] `docs/FUTURE.md` — kapsam dışı kalanlar ve gelecek çalışmalar
- [ ] Demo senaryosu: sentetik veri yükle → temizle → analiz et → tahmin üret → öneri al → dashboard'a koy → canlı akışı göster → ERP verisiyle birleştir
- [ ] Staj sunumu / kapanış raporu

---

## İlerleme Özeti

| Modül | Durum | Not |
|---|---|---|
| M01 Veri girişi ve ön işleme | ⬜ | |
| M02 Veri depolama ve yönetim | ⬜ | |
| M03 Gelişmiş analitik | ⬜ | |
| M04 Tahmin ve öngörü | ⬜ | |
| M05 Otomatik karar destek | ⬜ | |
| M06 Raporlama ve görselleştirme | ⬜ | |
| M07 Gerçek zamanlı veri işleme | ⬜ | |
| M08 Veri güvenliği ve gizlilik | ⬜ | |
| M09 API ve entegrasyon | ⬜ | |
| M10 Kullanıcı yönetimi | ⬜ | |
| M11 Güncelleme ve bakım | ⬜ | |
| M12 Yedekleme ve kurtarma | ⬜ | |
| M13 Performans izleme | ⬜ | |
| M14 Model eğitimi ve güncelleme | ⬜ | |
| M15 ERP entegrasyonu | ⬜ | |

`⬜ başlanmadı · 🟡 devam ediyor · ✅ bitti · ⚠️ sorunlu`

---

## Bilinen Sorunlar

- **[Gün 1 / açık]** SOTA kaynakçasındaki künyeler ve doküman URL'leri çevrimdışı yazıldı; rapora girmeden önce doğrulanmalı (özellikle literatür künyeleri ve ürün doküman linkleri).
- **[Gün 1 / açık]** SOTA'daki ürün bilgileri (Power BI/Fabric vb.) Oca 2026 bilgisine dayanıyor; teslim öncesi hızlı gözden geçirme gerekebilir.
- **[Gün 2 / kapandı]** Docker Desktop kuruldu, `docker compose up -d` ile 12 servisin tamamı doğrulandı. Yol boyunca iki port çakışması (host'ta native Postgres 17 → 5432, macOS ControlCenter/AirPlay → 5000) ve iki tek-dosya bind-mount kaynaklı VM kilitlenmesi (postgres, prometheus — `docker rm -f` bile yanıt vermiyordu, Docker Desktop'ta 5-10 dk sonra kendiliğinden çözüldü) giderildi; `docker-compose.yml` artık dizin bazlı mount kullanıyor. Detay: `docs/ARCHITECTURE.md` § Açık Notlar.
- **[Gün 2 / kapandı]** git `user.name`/`user.email` kullanıcıdan alınıp bu repo için yerel olarak (`git config --local`) ayarlandı.

---

## Kapsam Kesme Sırası (gerekirse)

M11 → M13 → M08 → M15 → M07. **M01–M06 ve M10 asla kesilmez.**
Kesme kararını Claude vermez, önerir.
