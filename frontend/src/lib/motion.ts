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

/**
 * WebGL gerçekten kullanılabilir mi?
 *
 * `'webgl' in window` gibi bir kontrol yetmez: bazı tarayıcılarda (ör. Opera
 * GX'te donanım hızlandırma kapatıldığında) WebGL API'si mevcuttur ama
 * `getContext` sessizce `null` döner ya da three.js'in WebGLRenderer'ı context
 * kurulumunda atar. R3F <Canvas> bu durumu kendi başına yakalamaz — mount
 * olur, ardından WebGLRenderer içeride hata fırlatır ve yakalanmamış promise
 * reddi olarak konsola düşer.
 *
 * Bunun yerine, <Canvas>'ı hiç mount ETMEDEN önce atılabilir bir tuval
 * üzerinde context kurulumunu deniyoruz. Başarısızsa 3D katman tamamen
 * atlanır — sayfa metin/scroll deneyimi olarak eksiksiz kalır, tıpkı
 * `usePrefersReducedMotion` true döndüğünde olduğu gibi.
 */
export function useWebglAvailable(): boolean {
  const [available] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const canvas = document.createElement('canvas')
      const context =
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      return context !== null
    } catch {
      return false
    }
  })

  return available
}
