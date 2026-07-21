import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { MODULES, PHASE_LABELS } from '../lib/modules'
import { gsap, useGSAP, usePrefersReducedMotion } from '../lib/motion'
import { ModuleCover } from './ModuleCover'

/** GLSL smoothstep — three.js `MathUtils.smoothstep(x, min, max)` ile aynı imza. */
function smoothstep(x: number, min: number, max: number): number {
  if (x <= min) return 0
  if (x >= max) return 1
  const t = (x - min) / (max - min)
  return t * t * (3 - 2 * t)
}

/** Yörünge oranları: yatay yarıçap 11'e karşı derinlik 5, merkez -6 birim geride. */
const RATIO_DEPTH = 5 / 11
const RATIO_OFFSET = 6 / 11
/** Kartın kaç birim uzaklıktan sonra tamamen görünmez olduğu (alfa 0). */
const FADE_END = 2.5
/** Bu uzaklıktan öteye hiç transform yazılmaz — 15 karttan yalnızca ~5'i görünür. */
const CULL = 3.2

/**
 * Kartların 3B bir yörüngede döndüğü galeri.
 *
 * Kartlar bir elips üzerinde ilerler: yatayda `sin`, derinlikte `cos` ile
 * konumlanır ve sahnenin arkasına doğru çekilirken kendi ekseninde döner.
 * Buna dikeyde sabit bir kayma eklenince hareket çapraz bir yay hâline gelir —
 * kartlar hero'nun arkasına doğru dönerek uzaklaşır. Odaktaki kart büyür,
 * uzaktakiler küçülüp söner.
 *
 * Kartlar WebGL değil gerçek DOM öğesidir: bağlantılar gerçek `<a>`, metin
 * seçilebilir ve arama motoru tarafından okunabilir kalır. Konumlar her karede
 * doğrudan `style.transform`'a yazılır — React state'i kullanılmaz, çünkü
 * scroll boyunca kare başına render tetiklemek gereksiz maliyettir.
 */
export function OrbitGallery() {
  const reduced = usePrefersReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])

  useGSAP(
    () => {
      if (reduced) return

      const layout = (u: number) => {
        // Yarıçaplar pencere genişliğine bağlı: dar ekranda yay daralır,
        // yoksa kartlar görüş alanının dışına savrulur.
        const radiusX = Math.min(430, window.innerWidth * 0.3)
        const radiusZ = radiusX * RATIO_DEPTH
        const offsetZ = -radiusX * RATIO_OFFSET
        const stepY = Math.min(150, window.innerWidth * 0.075)

        cardRefs.current.forEach((card, index) => {
          if (!card) return
          const x = index + 1 - u
          const distance = Math.abs(x)

          if (distance > CULL) {
            card.style.visibility = 'hidden'
            card.style.pointerEvents = 'none'
            card.setAttribute('aria-hidden', 'true')
            card.tabIndex = -1
            return
          }

          const alpha = 1 - smoothstep(distance, 0.8, FADE_END)
          const scale = 0.9 + 0.2 * (1 - Math.min(1, distance))
          const translateX = Math.sin(x) * radiusX
          const translateZ = Math.cos(x) * radiusZ + offsetZ
          const translateY = -x * stepY
          const rotateY = x * 0.6 * (180 / Math.PI)

          card.style.visibility = 'visible'
          card.style.opacity = String(alpha)
          card.style.transform =
            `translate(-50%, -50%) translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, ${translateZ.toFixed(2)}px) ` +
            `rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`
          card.style.zIndex = String(Math.round(1000 - distance * 100))

          // Yalnızca odaktaki kart tıklanabilir ve klavyeyle erişilebilir;
          // arkadakiler görsel olarak oradadır ama hedef değildir. On beş
          // durağın tamamına klavyeyle erişim başlıktaki "Tümü" dizininden
          // sağlanır (bkz. Layout.tsx → ModuleIndex).
          const focused = distance < 0.6
          card.style.pointerEvents = focused ? 'auto' : 'none'
          card.tabIndex = focused ? 0 : -1
          if (focused) card.removeAttribute('aria-hidden')
          else card.setAttribute('aria-hidden', 'true')
        })
      }

      // Yörünge ilerlemesini süren vekil nesne. `scrub` sayesinde scroll
      // durduğunda değer hedefe yumuşayarak oturur — fizik tabanlı atalet
      // hissi buradan gelir. (Tween'siz bir ScrollTrigger'da `onUpdate`
      // tetiklenmez; bkz. HomePage.tsx'teki boru hattı notu.)
      const progress = { u: 0 }
      layout(0)

      gsap.to(progress, {
        u: MODULES.length + 1,
        ease: 'none',
        onUpdate: () => layout(progress.u),
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.9,
          invalidateOnRefresh: true,
        },
      })

      const onResize = () => layout(progress.u)
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    },
    { scope: sectionRef, dependencies: [reduced] },
  )

  return (
    <section
      id="hat"
      ref={sectionRef}
      className="relative z-10 bg-carbon"
      style={reduced ? undefined : { height: `${(MODULES.length + 1) * 40}vh` }}
    >
      <div
        className={
          reduced
            ? 'px-6 py-28 sm:px-10 lg:px-16'
            : 'sticky top-0 h-dvh overflow-hidden px-6 sm:px-10 lg:px-16'
        }
      >
        <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col">
          <div className="flex shrink-0 items-end justify-between pt-24">
            <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-extrabold">
              On beş durak, tek hat
            </h2>
            <span className="font-mono text-xs text-bone-faint tabular">Uçtan uca</span>
          </div>

          {/* Yörünge sahnesi. `perspective` dışta, `preserve-3d` içte —
              ikisi aynı öğede olursa derinlik düzleşir. */}
          <div
            className={reduced ? 'mt-12' : 'relative min-h-0 flex-1'}
            style={reduced ? undefined : { perspective: '1250px' }}
          >
            <div
              className={
                reduced
                  ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'
                  : 'absolute top-1/2 left-1/2 h-0 w-0'
              }
              style={reduced ? undefined : { transformStyle: 'preserve-3d' }}
            >
              {MODULES.map((module, index) => (
                <Link
                  key={module.to}
                  to={module.to}
                  ref={(element) => {
                    cardRefs.current[index] = element
                  }}
                  className={`group flex flex-col justify-end overflow-hidden rounded-2xl border border-[var(--edge)] bg-carbon-raised transition-[border-color] duration-300 hover:border-warm/45 ${
                    reduced
                      ? 'relative min-h-[15rem] p-6'
                      : 'absolute top-0 left-0 h-[clamp(17rem,32vw,25rem)] w-[clamp(13rem,23vw,19rem)] p-6 will-change-transform'
                  }`}
                  style={reduced ? undefined : { visibility: 'hidden', backfaceVisibility: 'hidden' }}
                >
                  <ModuleCover
                    module={module}
                    className="absolute inset-0 h-full w-full opacity-70 transition-opacity duration-500 group-hover:opacity-45"
                  />
                  <span
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-carbon-raised via-carbon-raised/80 to-transparent"
                    aria-hidden="true"
                  />

                  <div className="relative">
                    <span className="eyebrow">{PHASE_LABELS[module.phase]}</span>
                    <h3 className="mt-3 font-display text-2xl font-extrabold">{module.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-bone-faint">{module.summary}</p>
                    <span className="mt-4 flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-bone-faint uppercase transition-colors duration-300 group-hover:text-warm">
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
        </div>
      </div>
    </section>
  )
}
