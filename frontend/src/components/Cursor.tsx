import { useEffect, useRef } from 'react'
import { gsap, usePrefersReducedMotion, usePointerFine } from '../lib/motion'

/**
 * Site geneli özel imleç: hızlı bir nokta + gecikmeli bir halka.
 *
 * `[data-cursor-hover]` işaretli öğelerin üzerine gelindiğinde halka
 * büyüyüp sıcak renge döner — buton/kart gibi etkileşimli yüzeyleri
 * imlecin kendisiyle işaretler. Olay delegasyonu (document üzerinde tek
 * dinleyici) kullanılıyor ki `data-cursor-hover` öğeleri rota değişince
 * mount/unmount olsa da yeniden sorgulamaya gerek kalmasın.
 *
 * Dokunmatikte veya hareket azaltmada hiç kurulmaz — `null` döner.
 */
export function Cursor() {
  const reduced = usePrefersReducedMotion()
  const fine = usePointerFine()
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  const active = !reduced && fine

  useEffect(() => {
    if (!active) return
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 })
    document.documentElement.classList.add('cursor-active')

    const setDotX = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3.out' })
    const setDotY = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3.out' })
    const setRingX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' })
    const setRingY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' })

    const onMove = (event: MouseEvent) => {
      setDotX(event.clientX)
      setDotY(event.clientY)
      setRingX(event.clientX)
      setRingY(event.clientY)
    }

    const onOver = (event: MouseEvent) => {
      if ((event.target as HTMLElement | null)?.closest('[data-cursor-hover]')) {
        ring.classList.add('cursor-ring--active')
      }
    }
    const onOut = (event: MouseEvent) => {
      const from = (event.target as HTMLElement | null)?.closest('[data-cursor-hover]')
      const to = (event.relatedTarget as HTMLElement | null)?.closest('[data-cursor-hover]')
      if (from && !to) ring.classList.remove('cursor-ring--active')
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)

    return () => {
      document.documentElement.classList.remove('cursor-active')
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
    }
  }, [active])

  if (!active) return null

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
