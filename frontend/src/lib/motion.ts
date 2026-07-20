import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

/**
 * GSAP eklentileri uygulama ömrü boyunca bir kez kaydedilir.
 * Modül üst düzeyinde çağrılır; React'in StrictMode çift render'ından
 * etkilenmez çünkü modül gövdesi yalnızca bir defa çalışır.
 */
gsap.registerPlugin(ScrollTrigger, useGSAP)

// Geliştirme derlemesinde konsoldan tetikleyicileri inceleyebilmek için.
// Üretim derlemesinde bu blok tamamen elenir.
if (import.meta.env.DEV) {
  Object.assign(window as unknown as Record<string, unknown>, { __gsap: gsap, __st: ScrollTrigger })
}

export { gsap, ScrollTrigger, useGSAP }

/**
 * Kullanıcının işletim sistemi düzeyindeki "hareketi azalt" tercihi.
 *
 * Sadece ilk değeri okumakla yetinmiyoruz: kullanıcı tercihi sayfa açıkken
 * değiştirebilir (macOS'ta erişilebilirlik ayarı anlık uygulanır), o yüzden
 * medya sorgusunu dinliyoruz.
 *
 * Bu kanca sayfadaki bütün scrub/pin animasyonlarının ve WebGL sahnesinin
 * anahtarıdır — true dönerse hiçbiri kurulmaz.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}
