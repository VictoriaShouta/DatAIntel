import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, usePrefersReducedMotion } from '../lib/motion'

/**
 * Yumuşak kaydırma katmanı (Lenis) + GSAP ScrollTrigger köprüsü.
 *
 * Neden gerekli: Lenis scroll konumunu kendi rAF döngüsünde sürer. ScrollTrigger
 * ise tarayıcının native scroll olayını dinler. İkisi ayrı saatlerde çalışırsa
 * pinlenen bölümler bir kare geriden gelir ve titrer. Çözüm, Lenis'i GSAP'ın
 * ticker'ına bağlayıp ScrollTrigger'ı Lenis'in scroll olayında güncellemek —
 * böylece ikisi tek kare bütçesini paylaşır.
 *
 * `prefers-reduced-motion: reduce` durumunda Lenis hiç kurulmaz; sayfa tamamen
 * native scroll ile çalışır. Yumuşatılmış kaydırma vestibüler rahatsızlığın
 * bilinen tetikleyicilerindendir, dolayısıyla bu bir süsleme değil kapatılması
 * gereken bir davranıştır.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return

    const lenis = new Lenis({
      duration: 1.1,
      // Üstel yavaşlama: hızlı başlar, sona doğru yumuşakça durur.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Dokunmatikte native ivme zaten iyi; Lenis'i araya sokmak bozar.
      syncTouch: false,
    })

    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    // Yalnızca geliştirme derlemesinde: konsoldan ve otomatik testlerden
    // kaydırmayı sürebilmek için örneği açığa çıkarıyoruz. Lenis devredeyken
    // `window.scrollTo` ScrollTrigger'ı güncellemez, bu yüzden gerekli.
    // Üretim derlemesinde bu blok tamamen elenir.
    if (import.meta.env.DEV) {
      ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis
    }

    // GSAP ticker saniye verir, Lenis milisaniye bekler.
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    }
  }, [reduced])

  return <>{children}</>
}
