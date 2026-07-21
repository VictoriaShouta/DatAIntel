import { Suspense, lazy, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MODULES, PHASE_LABELS } from '../lib/modules'
import { ScrollTrigger, gsap, usePrefersReducedMotion, useGSAP, useWebglAvailable } from '../lib/motion'

// three ~600KB. Ana paketten çıkarılır; hero metni beklemeden görünür.
const DataCloud = lazy(() => import('../components/three/DataCloud'))

/**
 * Boru hattının dört durağı. Sıra, nokta bulutunun morph sırasıyla birebir
 * aynıdır (bkz. dataCloudGeometry.ts) — metin ne anlatıyorsa 3D obje o anda
 * o şekli alır.
 */
const STAGES = [
  {
    index: '01',
    kicker: 'Toplama',
    title: 'Ham veri düzensiz girer',
    body: 'Dosya yüklemesi, ERP uçları ve canlı akış. Farklı şemalar, eksik alanlar, tutarsız tipler. Bu aşamada verinin bir yönü yoktur — yalnızca hacmi vardır.',
    meta: ['CSV · Excel · JSON', 'ERP REST uçları', 'Redpanda olay akışı'],
  },
  {
    index: '02',
    kicker: 'Yapı',
    title: 'Şemaya oturur, sorgulanabilir olur',
    body: 'Tip çıkarımı, temizleme profilleri ve doğrulama kuralları. Kayıtlar satır ve sütuna yerleşir, meta veri kataloğuna işlenir, indekslenir.',
    meta: ['Tip çıkarımı', 'Temizleme profilleri', 'Meta veri kataloğu'],
  },
  {
    index: '03',
    kicker: 'Çözümleme',
    title: 'Şeklini ve eğilimini gösterir',
    body: 'Dağılımlar, korelasyonlar, kümeler. Zaman serisi modelleri geçmişi öğrenir, sapmaları işaretler, önümüzdeki dönemi tahmin eder.',
    meta: ['Korelasyon · kümeleme', 'Zaman serisi tahmini', 'MLflow deney takibi'],
  },
  {
    index: '04',
    kicker: 'Karar',
    title: 'Tek bir eyleme iner',
    body: 'Kural motoru eşikleri değerlendirir ve gerekçesiyle birlikte bir öneri üretir. Panelde görünür, rapora düşer, webhook ile karşı sisteme gider.',
    meta: ['Eşik ve kural motoru', 'Gerekçeli öneri', 'Rapor · webhook'],
  },
] as const

/** Mimari katmanlar — pazarlama sayısı değil, fiilen kurulu olan yığın. */
const STACK = [
  { layer: 'Uygulama', items: 'FastAPI · React 19 · Vite' },
  { layer: 'Veri', items: 'PostgreSQL 16 · Redis' },
  { layer: 'Akış', items: 'Redpanda · WebSocket köprüsü' },
  { layer: 'Model', items: 'scikit-learn · MLflow' },
  { layer: 'Asenkron iş', items: 'Celery worker + beat' },
  { layer: 'İzleme', items: 'Prometheus · Grafana' },
]

export function HomePage() {
  const reduced = usePrefersReducedMotion()
  // WebGL kapalı/kullanılamaz olduğunda (ör. donanım hızlandırması kapatılmış
  // tarayıcılar) 3D katman hiç kurulmaz; boru hattı metni ve scroll animasyonu
  // bundan etkilenmeden çalışmaya devam eder.
  const webglAvailable = useWebglAvailable()
  const showCloud = !reduced && webglAvailable

  // Nokta bulutunun ilerlemesi (0..3). Bilinçli olarak state DEĞİL:
  // her scroll karesinde React render'ı tetiklemek 24 bin parçacıkta
  // kare düşürür. GSAP buraya yazar, useFrame buradan okur.
  const progressRef = useRef(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const heroWrapRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const pipelineRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const [activeStage, setActiveStage] = useState(0)
  const activeStageRef = useRef(0)

  useGSAP(
    () => {
      // Hareket azaltma açıksa hiçbir ScrollTrigger kurulmaz. İçerik zaten
      // CSS'te tam görünür durumda; animasyon yalnızca üzerine eklenir.
      if (reduced) return

      // --- Giriş: hero kademeli belirir ---------------------------------
      gsap.from('[data-hero-line]', {
        yPercent: 118,
        duration: 1.15,
        ease: 'expo.out',
        stagger: 0.09,
      })
      gsap.from('[data-hero-fade]', {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: 'power2.out',
        stagger: 0.1,
        delay: 0.45,
      })

      // --- Çıkış: hero çapraz yukarı ivmelenerek sahneden ayrılır --------
      // `heroWrapRef` hero'dan daha uzun (bkz. JSX) — aradaki fazla scroll
      // mesafesi bu tween'in "koşu pisti"dır. Hero kendi kutusunda sticky
      // kaldığı için transform saf görsel bir hareket; layout'u etkilemez,
      // bu yüzden GSAP `pin` yerine burada da sticky + scrub deseni
      // kullanılıyor (bkz. boru hattı bölümündeki not). DataCloud (z-0,
      // fixed, tüm sayfa boyunca) hero'nun (z-20) arkasında zaten hazır
      // duruyor — hero çekildikçe ayrıca bir katman açmaya gerek yok.
      if (heroRef.current && heroWrapRef.current) {
        gsap.to(heroRef.current, {
          xPercent: 24,
          yPercent: -120,
          rotate: -6,
          scale: 0.92,
          ease: 'power2.inOut',
          force3D: true,
          scrollTrigger: {
            trigger: heroWrapRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.1,
          },
        })
      }

      // --- Boru hattı: scroll konumu 3D morph'u sürer -------------------
      // DİKKAT: burada `scrub` KULLANILMAZ. Animasyonu olmayan bir
      // ScrollTrigger'da scrub'ı süren bir tween olmadığı için `onUpdate`
      // hiç tetiklenmez ve aşama metni ilk durakta takılı kalır.
      // Yumuşatma zaten DataCloud'un useFrame döngüsünde yapılıyor
      // (hedefe üstel yaklaşma), dolayısıyla scrub gereksizdi.
      ScrollTrigger.create({
        trigger: pipelineRef.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          // 0..1 → 0..3 (dört durak arası)
          progressRef.current = self.progress * 3

          // Aktif durak metni: sadece değiştiğinde render tetikle,
          // her karede değil.
          const next = Math.min(STAGES.length - 1, Math.round(self.progress * 3))
          if (next !== activeStageRef.current) {
            activeStageRef.current = next
            setActiveStage(next)
          }
        },
      })

      // Bulut yalnızca hero + boru hattı boyunca görünür; modül galerisi
      // başlarken sahneden çekilir ki kartların arkasında gürültü yapmasın.
      // WebGL yoksa katman hiç render edilmez (canvasWrapRef.current null
      // kalır) — gsap.to(null, …) gereksiz bir "target not found" uyarısı
      // basar, o yüzden burada atlıyoruz.
      if (canvasWrapRef.current) {
        gsap.to(canvasWrapRef.current, {
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: pipelineRef.current,
            start: 'bottom bottom-=25%',
            end: 'bottom top+=25%',
            scrub: true,
          },
        })
      }

      // --- Modül galerisi: dikey scroll yatay harekete çevrilir ---------
      const track = trackRef.current
      if (track) {
        gsap.to(track, {
          // Fonksiyon olarak veriliyor ki pencere yeniden boyutlandığında
          // invalidateOnRefresh ile doğru mesafe yeniden hesaplansın.
          x: () => -(track.scrollWidth - window.innerWidth + 64),
          ease: 'none',
          scrollTrigger: {
            trigger: galleryRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })
      }

      // --- Genel bölüm açılışları --------------------------------------
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.from(element.children, {
          opacity: 0,
          y: 26,
          duration: 0.65,
          ease: 'power2.out',
          stagger: 0.07,
          scrollTrigger: { trigger: element, start: 'top 82%' },
        })
      })

      // Fontlar geç yüklenirse yükseklikler kayar; ölçümleri tazele.
      document.fonts?.ready.then(() => ScrollTrigger.refresh())
    },
    { scope: rootRef, dependencies: [reduced, webglAvailable] },
  )

  return (
    <div ref={rootRef} className="relative">
      {/* Sabit 3D katman — içeriğin arkasında, tıklamaları engellemez */}
      {showCloud && (
        <div
          ref={canvasWrapRef}
          className="pointer-events-none fixed inset-0 z-0"
          aria-hidden="true"
        >
          <Suspense fallback={null}>
            <DataCloud progressRef={progressRef} />
          </Suspense>
        </div>
      )}

      {/* ================= HERO ================= */}
      {/* Sarmalayıcı hero'dan daha uzun (180vh): fazladan 80vh, hero'nun
          çapraz çıkış animasyonu için "koşu pisti". Hareket azaltmada
          sarmalayıcı hero ile aynı yüksekliğe döner — sticky de, tween de
          hiç kurulmaz, boş scroll alanı kalmaz. */}
      <div ref={heroWrapRef} className={`relative z-20 ${reduced ? '' : 'h-[180vh]'}`}>
        <section
          ref={heroRef}
          className={`grain relative flex min-h-dvh flex-col justify-end overflow-hidden px-6 pb-14 sm:px-10 lg:px-16 ${reduced ? '' : 'sticky top-0'}`}
        >
          <div className="grid-veil pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

        <div className="mx-auto w-full max-w-[1400px]">
          <p data-hero-fade className="eyebrow mb-8">
            Veri analitiği ve tahmin platformu
          </p>

          <h1 className="font-display text-[clamp(2.9rem,9.2vw,8.8rem)] font-extrabold leading-[0.92] tracking-[-0.045em]">
            {/* Her satır kendi maskesinin içinden yukarı doğru açılır */}
            <span className="block overflow-hidden pb-[0.08em]">
              <span data-hero-line className="block">
                Veriyi karara
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <span data-hero-line className="block text-warm">
                dönüştüren hat
              </span>
            </span>
          </h1>

          <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <p data-hero-fade className="max-w-md text-lg leading-relaxed text-bone-dim">
              Toplama, çözümleme, tahmin ve karar. Uçtan uca tek bir boru hattı olarak
              çalışır — arada elle taşınan hiçbir dosya yoktur.
            </p>

            <div data-hero-fade className="flex flex-wrap items-center gap-3">
              <Link
                to="/m13-performans"
                className="rounded-xl bg-bone px-6 py-3.5 text-[15px] font-semibold text-carbon transition-colors duration-200 hover:bg-warm"
              >
                Canlı panele git
              </Link>
              <a
                href="#mimari"
                className="rounded-xl border border-[var(--edge-strong)] px-6 py-3.5 text-[15px] font-medium text-bone transition-colors duration-200 hover:border-warm/60 hover:text-warm"
              >
                Mimariye bak
              </a>
            </div>
          </div>

          <div
            data-hero-fade
            className="mt-14 flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] text-bone-faint uppercase"
          >
            <span className="h-px w-10 bg-[var(--edge-strong)]" aria-hidden="true" />
            Aşağı kaydırın
          </div>
        </div>
        </section>
      </div>

      {/* ================= BORU HATTI (sticky sahne) =================
          Yüksek bir kapsayıcı içinde yapışkan bir görünüm: scroll ilerledikçe
          hem metin değişir hem de arkadaki nokta bulutu şekil değiştirir.
          GSAP `pin` yerine CSS sticky kullanıldı — Lenis ile birlikte
          yeniden hesaplama (refresh) hatalarına açık değil. */}
      <section
        id="platform"
        ref={pipelineRef}
        className={`relative z-10 ${reduced ? 'py-28' : 'h-[420vh]'}`}
      >
        <div
          className={
            reduced
              ? 'px-6 sm:px-10 lg:px-16'
              : 'sticky top-0 flex h-dvh items-center overflow-hidden px-6 sm:px-10 lg:px-16'
          }
        >
          <div className="mx-auto w-full max-w-[1400px]">
            {/* Durak göstergesi — hareket azaltmada aşamalar zaten alt alta
                okunduğu için göstergeye gerek yok. */}
            <ol className={`mb-12 flex gap-2 ${reduced ? 'hidden' : ''}`} aria-label="Boru hattı aşamaları">
              {STAGES.map((stage, index) => (
                <li key={stage.index} className="flex-1">
                  <span
                    className="block h-px w-full origin-left transition-all duration-500"
                    style={{
                      background:
                        index <= activeStage ? 'var(--color-warm)' : 'var(--edge-strong)',
                      transform: index === activeStage ? 'scaleY(3)' : 'scaleY(1)',
                      transitionTimingFunction: 'var(--ease-soft)',
                    }}
                  />
                  <span
                    className="mt-3 block font-mono text-[11px] tracking-[0.16em] uppercase transition-colors duration-500"
                    style={{
                      color:
                        index === activeStage ? 'var(--color-warm)' : 'var(--color-bone-faint)',
                    }}
                  >
                    {stage.kicker}
                  </span>
                </li>
              ))}
            </ol>

            {/* Dört metin bloğu normalde üst üste durur; yalnızca aktif olan
                görünür ve yükseklik en uzun bloğa göre sabitlenir ki geçişte
                zıplamasın.

                Hareket azaltma açıkken scroll animasyonu hiç kurulmadığı için
                `activeStage` 0'da kalır — bu düzende diğer üç aşamaya asla
                erişilemezdi. Bu yüzden o durumda bloklar normal akışta,
                hepsi görünür şekilde alt alta dizilir. */}
            <div
              className={
                reduced
                  ? 'flex max-w-2xl flex-col gap-16'
                  : 'relative min-h-[21rem] max-w-2xl sm:min-h-[17rem]'
              }
            >
              {STAGES.map((stage, index) => {
                const isActive = reduced || index === activeStage
                return (
                  <article
                    key={stage.index}
                    aria-hidden={!isActive}
                    className={
                      reduced ? '' : 'absolute inset-0 transition-all duration-[600ms]'
                    }
                    style={
                      reduced
                        ? undefined
                        : {
                            opacity: isActive ? 1 : 0,
                            transform: isActive ? 'translateY(0)' : 'translateY(20px)',
                            transitionTimingFunction: 'var(--ease-soft)',
                            pointerEvents: isActive ? 'auto' : 'none',
                          }
                    }
                  >
                    <div className="mb-5 flex items-center gap-4">
                      <span className="font-mono text-sm text-warm tabular">{stage.index}</span>
                      <span className="h-px w-12 bg-[var(--edge-strong)]" aria-hidden="true" />
                    </div>

                    <h2 className="font-display text-[clamp(1.9rem,4.4vw,3.4rem)] font-extrabold">
                      {stage.title}
                    </h2>

                    <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-bone-dim">
                      {stage.body}
                    </p>

                    <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-bone-faint">
                      {stage.meta.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-cold" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================= MODÜL GALERİSİ (yatay) ================= */}
      {/* Hareket azaltma açıkken yatay sürükleme kurulmaz; şerit yerinde
          kalacağı için 15 kartın 12'sine ulaşılamazdı. O durumda bölüm normal
          yüksekliğe döner ve kartlar sarmalı bir ızgara olarak dizilir. */}
      <section
        id="hat"
        ref={galleryRef}
        className="relative z-10 bg-carbon"
        style={reduced ? undefined : { height: `${MODULES.length * 42}vh` }}
      >
        <div
          className={
            reduced
              ? 'py-28'
              : 'sticky top-0 flex h-dvh flex-col justify-center overflow-hidden'
          }
        >
          <div className="mx-auto mb-10 flex w-full max-w-[1400px] items-end justify-between px-6 sm:px-10 lg:px-16">
            <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-extrabold">
              On beş durak, tek hat
            </h2>
            <span className="font-mono text-xs text-bone-faint tabular">Uçtan uca</span>
          </div>

          {/* Dikey scroll bu şeridi yatayda sürer */}
          <div
            ref={trackRef}
            className={
              reduced
                ? 'mx-auto grid w-full max-w-[1400px] gap-5 px-6 sm:grid-cols-2 sm:px-10 lg:grid-cols-3 lg:px-16'
                : 'flex gap-5 pr-16 pl-6 sm:pl-10 lg:pl-16'
            }
          >
            {MODULES.map((module) => (
              <Link
                key={module.to}
                to={module.to}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--edge)] bg-carbon-raised p-6 transition-colors duration-300 hover:border-warm/45 ${
                  reduced
                    ? 'min-h-[15rem] gap-8'
                    : 'h-[clamp(17rem,42vh,24rem)] w-[clamp(15rem,26vw,20rem)] shrink-0'
                }`}
              >
                {/* Hover'da alttan yükselen sıcak ışıma */}
                <span
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-40 translate-y-8 bg-gradient-to-t from-warm/15 to-transparent opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                  style={{ transitionTimingFunction: 'var(--ease-soft)' }}
                  aria-hidden="true"
                />

                <div className="relative flex items-start justify-between">
                  <span className="eyebrow">{PHASE_LABELS[module.phase]}</span>
                </div>

                <div className="relative">
                  <h3 className="font-display text-2xl font-extrabold transition-transform duration-300 group-hover:-translate-y-0.5">
                    {module.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-bone-faint">{module.summary}</p>
                  <span className="mt-5 flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-bone-faint uppercase transition-colors duration-300 group-hover:text-warm">
                    İncele
                    <span
                      className="transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MİMARİ ================= */}
      <section id="mimari" className="relative z-10 bg-carbon px-6 py-32 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-[1400px]">
          <div data-reveal className="max-w-2xl">
            <p className="eyebrow mb-6">Mimari</p>
            <h2 className="font-display text-[clamp(1.9rem,4.4vw,3.4rem)] font-extrabold">
              Tek uygulama, gerçek altyapı
            </h2>
            <p className="mt-6 text-[17px] leading-relaxed text-bone-dim">
              Her şey tek bir uygulamanın içinde çalışır — ayrı servisler, ayrı süreçler
              yok. Aradaki sınırlar kod düzeyinde katı bir bağımlılık kuralıyla korunur
              ve kullanıcıya hiç sızmaz. Bütün yığın tek komutla ayağa kalkar.
            </p>
          </div>

          <dl
            data-reveal
            className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-[var(--edge)] bg-[var(--edge)] sm:grid-cols-2 lg:grid-cols-3"
          >
            {STACK.map((row) => (
              <div key={row.layer} className="bg-carbon p-7">
                <dt className="eyebrow mb-3">{row.layer}</dt>
                <dd className="font-mono text-sm leading-relaxed text-bone">{row.items}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ================= KAPANIŞ ================= */}
      <section className="grain relative z-10 overflow-hidden bg-carbon-sunken px-6 py-36 sm:px-10 lg:px-16">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(900px 420px at 50% 110%, rgb(255 163 26 / 0.14), transparent 70%)',
          }}
        />
        <div data-reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-[clamp(2.2rem,6vw,4.6rem)] font-extrabold">
            Hattın sonunda bir karar var
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-bone-dim">
            Panele girin, boru hattının her aşamasını çalışırken görün.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/m13-performans"
              className="rounded-xl bg-warm px-7 py-3.5 text-[15px] font-semibold text-carbon transition-colors duration-200 hover:bg-bone"
            >
              Panele git
            </Link>
            <Link
              to="/m01-veri-girisi"
              className="rounded-xl border border-[var(--edge-strong)] px-7 py-3.5 text-[15px] font-medium text-bone transition-colors duration-200 hover:border-warm/60 hover:text-warm"
            >
              Veri yüklemeyle başla
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
