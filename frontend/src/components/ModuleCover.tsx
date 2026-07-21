import { useMemo } from 'react'
import type { ModuleEntry } from '../lib/modules'

/** FNV-1a — modül koduna bağlı sabit bir tohum üretir (her render aynı sonucu verir). */
function hashSeed(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Modül başına gerçek ekran görüntüsü henüz yok (sayfalar Gün 3-10 boyunca
 * dolacak) — onun yerine marka işaretindeki (bkz. `Layout.tsx` → `Mark`)
 * yükselen nokta/çizgi motifinin modül koduna göre sabit üretilen bir
 * varyasyonu kullanılıyor. Rastgele değil: aynı modül her zaman aynı
 * kompozisyonu üretir, her render'da yeniden hesaplanmaz.
 */
export function ModuleCover({ module, className = '' }: { module: ModuleEntry; className?: string }) {
  const seed = useMemo(() => hashSeed(module.code), [module.code])
  const accent = seed % 2 === 0 ? 'var(--color-warm)' : 'var(--color-cold)'

  const points = useMemo(() => {
    const rand = mulberry32(seed)
    const count = 4 + Math.floor(rand() * 3)
    const pts: { x: number; y: number; r: number }[] = []
    let x = 6 + rand() * 12
    let y = 90 - rand() * 8
    for (let i = 0; i < count; i++) {
      pts.push({ x, y, r: 1.3 + rand() * 1.7 })
      x += 13 + rand() * 15
      y -= 11 + rand() * 17
    }
    return pts
  }, [seed])

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  const gradientId = `module-glow-${module.code}`

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="100%" r="80%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="var(--color-carbon-raised)" />
      <rect width="100" height="100" fill={`url(#${gradientId})`} />
      <path d={pathD} fill="none" stroke={accent} strokeOpacity="0.55" strokeWidth="0.6" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill={accent}
          opacity={0.45 + (i / points.length) * 0.5}
        />
      ))}
    </svg>
  )
}
