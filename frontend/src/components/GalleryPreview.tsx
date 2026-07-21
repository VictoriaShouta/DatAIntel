import { useEffect, useRef } from 'react'
import { gsap, usePrefersReducedMotion, usePointerFine } from '../lib/motion'
import { ModuleCover } from './ModuleCover'
import type { ModuleEntry } from '../lib/modules'

/**
 * İmleci izleyen, hafifçe 3B eğilen modül önizleme paneli.
 *
 * alche.studio'daki proje listesinde imlecin yanında beliren dikdörtgen
 * önizlemenin karşılığı — galerideki her kart için ayrı bir panel yerine
 * tek, paylaşılan bir panel var; `active` değiştikçe içeriği değişir.
 * Eğim (`rotateX`/`rotateY`) imlecin ekrandaki konumundan türetiliyor,
 * boş dururken de yavaş bir `rotateZ` salınımıyla "arkada dönen bir hacim"
 * hissi veriliyor.
 */
export function GalleryPreview({ active }: { active: ModuleEntry | null }) {
  const reduced = usePrefersReducedMotion()
  const fine = usePointerFine()
  const panelRef = useRef<HTMLDivElement>(null)
  const tiltRef = useRef<HTMLDivElement>(null)

  const enabled = !reduced && fine

  useEffect(() => {
    if (!enabled) return
    const panel = panelRef.current
    const tilt = tiltRef.current
    if (!panel || !tilt) return

    const setX = gsap.quickTo(panel, 'x', { duration: 0.5, ease: 'power3.out' })
    const setY = gsap.quickTo(panel, 'y', { duration: 0.5, ease: 'power3.out' })
    const setRX = gsap.quickTo(tilt, 'rotateX', { duration: 0.4, ease: 'power3.out' })
    const setRY = gsap.quickTo(tilt, 'rotateY', { duration: 0.4, ease: 'power3.out' })

    const onMove = (event: MouseEvent) => {
      setX(event.clientX + 30)
      setY(event.clientY - 96)
      setRY((event.clientX / window.innerWidth - 0.5) * 18)
      setRX((0.5 - event.clientY / window.innerHeight) * 18)
    }
    window.addEventListener('mousemove', onMove)

    // Boşta yavaş bir "nefes" dönüşü — panel kapalıyken de sürüyor,
    // maliyeti ihmal edilebilir (tek bir tween, tek bir öğe).
    const idle = gsap.to(tilt, {
      rotateZ: 5,
      duration: 3.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })

    return () => {
      window.removeEventListener('mousemove', onMove)
      idle.kill()
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      ref={panelRef}
      className="pointer-events-none fixed top-0 left-0 z-30 h-40 w-56 transition-opacity duration-300"
      style={{ opacity: active ? 1 : 0, perspective: '900px' }}
      aria-hidden="true"
    >
      <div
        ref={tiltRef}
        className="h-full w-full overflow-hidden rounded-xl border border-[var(--edge-strong)] shadow-2xl shadow-black/60"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {active && <ModuleCover module={active} className="h-full w-full" />}
      </div>
    </div>
  )
}
