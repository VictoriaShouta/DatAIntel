import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { MODULES, PHASE_LABELS, PRIMARY_NAV, type ModulePhase } from '../lib/modules'
import { SmoothScroll } from './SmoothScroll'

const PHASE_ORDER: ModulePhase[] = ['toplama', 'cozumleme', 'karar', 'isletme']

/** Marka işareti: yükselen dört ölçüm noktası ve bunları bağlayan eğilim çizgisi. */
function Mark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path
        d="M3 19 L9 13 L14 15.5 L21 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <circle cx="3" cy="19" r="1.7" fill="currentColor" opacity="0.5" />
      <circle cx="9" cy="13" r="1.7" fill="currentColor" opacity="0.7" />
      <circle cx="14" cy="15.5" r="1.7" fill="currentColor" opacity="0.85" />
      <circle cx="21" cy="6" r="2.4" fill="currentColor" />
    </svg>
  )
}

/**
 * Tam ekran modül dizini.
 *
 * 15 modül bir yatay nav çubuğuna sığmaz; sığdırmaya çalışmak da onları
 * okunmaz bir etiket şeridine çevirir. Bunun yerine dizin tam ekran açılır,
 * modüller boru hattı aşamalarına göre gruplanır ve kademeli olarak belirir.
 */
function ModuleIndex({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    // Arkadaki sayfa kaymasın; Lenis de body taşmasına uyar
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Odağı panele taşı ki klavye kullanıcısı arkadaki bağlantılarda kaybolmasın
    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  let revealIndex = 0

  return (
    <div
      ref={panelRef}
      id="modul-dizini"
      role="dialog"
      aria-modal="true"
      aria-label="Modül dizini"
      tabIndex={-1}
      inert={!open}
      className={`fixed inset-0 z-40 overflow-y-auto bg-carbon-sunken/[0.97] backdrop-blur-xl transition-all duration-500 ${
        open ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
      style={{ transitionTimingFunction: 'var(--ease-soft)' }}
    >
      <div className="mx-auto max-w-[1400px] px-6 pt-28 pb-20 sm:px-10 lg:px-16">
        {PHASE_ORDER.map((phase) => (
          <section key={phase} className="mb-14 last:mb-0">
            <h2 className="eyebrow mb-5 border-b border-[var(--edge)] pb-3">
              {PHASE_LABELS[phase]}
            </h2>
            <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.filter((m) => m.phase === phase).map((module) => {
                // Kademeli belirme: dizin boydan boya aynı anda parlamak yerine
                // yukarıdan aşağı dolar. Kapalıyken gecikme yok — anında gider.
                const delay = open ? revealIndex++ * 28 : 0
                return (
                  <li key={module.code}>
                    <Link
                      to={module.to}
                      onClick={onClose}
                      className="group flex items-baseline gap-4 border-b border-transparent py-3 hover:border-[var(--edge)]"
                      style={{
                        opacity: open ? 1 : 0,
                        transform: open ? 'translateY(0)' : 'translateY(14px)',
                        transition:
                          'opacity .5s var(--ease-soft), transform .5s var(--ease-soft), border-color .3s ease',
                        transitionDelay: `${delay}ms`,
                      }}
                    >
                      <span className="font-mono text-xs text-bone-faint transition-colors group-hover:text-warm">
                        {module.code}
                      </span>
                      <span className="flex-1">
                        <span className="block font-display text-lg font-semibold tracking-tight text-bone transition-transform duration-300 group-hover:translate-x-1">
                          {module.name}
                        </span>
                        <span className="mt-0.5 block text-sm leading-snug text-bone-faint">
                          {module.summary}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

export function Layout() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname, hash } = useLocation()
  const onHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Rota değişince dizin kapanır; aksi halde yeni sayfanın üstünde asılı kalır
  useEffect(() => setMenuOpen(false), [pathname])

  // Sayfa içi çapa (#moduller) — Lenis devredeyken tarayıcının kendi atlaması
  // güvenilmez olduğu için hedefi elle kaydırıyoruz.
  useEffect(() => {
    if (!hash) return
    const target = document.querySelector(hash)
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  // Ana sayfa dışında header her zaman opak — içerik altından geçmesin
  const solid = scrolled || !onHome || menuOpen

  return (
    <SmoothScroll>
      <div className="min-h-dvh bg-carbon">
        <header
          className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
            solid
              ? 'border-b border-[var(--edge)] bg-carbon/85 backdrop-blur-xl'
              : 'border-b border-transparent'
          }`}
          style={{ transitionTimingFunction: 'var(--ease-soft)' }}
        >
          <div
            className={`mx-auto flex max-w-[1400px] items-center gap-6 px-6 transition-all duration-500 sm:px-10 lg:px-16 ${
              solid ? 'h-14' : 'h-20'
            }`}
            style={{ transitionTimingFunction: 'var(--ease-soft)' }}
          >
            <Link
              to="/"
              className="flex shrink-0 items-center gap-2.5 text-bone"
              aria-label="DatAIntel ana sayfa"
            >
              <Mark className="h-5 w-5 text-warm" />
              <span className="font-display text-[17px] font-extrabold tracking-tight">
                DatAIntel
              </span>
            </Link>

            <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Ana menü">
              {PRIMARY_NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded px-3 py-2 text-sm font-medium text-bone-dim transition-colors duration-200 hover:text-bone"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <NavLink
                to="/login"
                className="hidden rounded px-3 py-2 text-sm font-medium text-bone-dim transition-colors duration-200 hover:text-bone sm:block"
              >
                Giriş yap
              </NavLink>

              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-expanded={menuOpen}
                aria-controls="modul-dizini"
                className="flex items-center gap-2.5 rounded-lg border border-[var(--edge-strong)] px-3.5 py-2 text-sm font-medium text-bone transition-colors duration-200 hover:border-warm/50 hover:text-warm"
              >
                <span className="hidden sm:inline">{menuOpen ? 'Kapat' : 'Modüller'}</span>
                <span className="relative flex h-3 w-4 flex-col justify-between" aria-hidden="true">
                  <span
                    className="block h-px w-full bg-current transition-transform duration-300"
                    style={{
                      transform: menuOpen ? 'translateY(5.5px) rotate(45deg)' : 'none',
                      transitionTimingFunction: 'var(--ease-soft)',
                    }}
                  />
                  <span
                    className="block h-px w-full bg-current transition-opacity duration-200"
                    style={{ opacity: menuOpen ? 0 : 1 }}
                  />
                  <span
                    className="block h-px w-full bg-current transition-transform duration-300"
                    style={{
                      transform: menuOpen ? 'translateY(-5.5px) rotate(-45deg)' : 'none',
                      transitionTimingFunction: 'var(--ease-soft)',
                    }}
                  />
                </span>
              </button>

              <Link
                to="/m13-performans"
                className="rounded-lg bg-bone px-4 py-2 text-sm font-semibold text-carbon transition-colors duration-200 hover:bg-warm"
              >
                Panele git
              </Link>
            </div>
          </div>
        </header>

        <ModuleIndex open={menuOpen} onClose={() => setMenuOpen(false)} />

        {/* Ana sayfa hero'yu header'ın altına kadar uzatır; diğer sayfalar
            sabit header yüksekliği kadar boşluk bırakır. */}
        <main className={onHome ? '' : 'pt-14'}>
          <Outlet />
        </main>

        <footer className="relative z-10 border-t border-[var(--edge)] bg-carbon-sunken">
          <div className="mx-auto max-w-[1400px] px-6 py-14 sm:px-10 lg:px-16">
            <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
              <div className="max-w-sm">
                <div className="flex items-center gap-2.5 text-bone">
                  <Mark className="h-5 w-5 text-warm" />
                  <span className="font-display text-[17px] font-extrabold tracking-tight">
                    DatAIntel
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-bone-faint">
                  Akan veriyi toplayan, çözümleyen ve karara dönüştüren analitik platformu.
                  On beş modül tek bir boru hattında çalışır.
                </p>
              </div>

              <nav
                aria-label="Alt bilgi menüsü"
                className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-4"
              >
                {PHASE_ORDER.map((phase) => (
                  <div key={phase}>
                    <h2 className="eyebrow mb-3">{PHASE_LABELS[phase]}</h2>
                    <ul className="space-y-2">
                      {MODULES.filter((m) => m.phase === phase).map((module) => (
                        <li key={module.code}>
                          <Link
                            to={module.to}
                            className="text-sm text-bone-dim transition-colors duration-200 hover:text-warm"
                          >
                            {module.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>

            <div className="mt-12 flex flex-col gap-3 border-t border-[var(--edge)] pt-6 font-mono text-xs text-bone-faint sm:flex-row sm:items-center sm:justify-between">
              <span>DatAIntel · Yapay zekâ destekli veri analitiği</span>
              <span className="tabular">
                Demo ortamı · sentetik veri · v0.3 · {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  )
}
