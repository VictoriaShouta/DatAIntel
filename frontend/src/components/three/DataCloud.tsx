import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { createDataCloudGeometry } from './dataCloudGeometry'

const COLD = new THREE.Color('#45c8f1')
const WARM = new THREE.Color('#ffa31a')

const vertexShader = /* glsl */ `
  uniform float uProgress;   // 0..3 — hangi durak ve aradaki oran
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;

  attribute vec3 aStage1;
  attribute vec3 aStage2;
  attribute vec3 aStage3;
  attribute float aSeed;

  varying float vSeed;
  varying float vDepth;

  void main() {
    float stage = floor(uProgress);
    float raw = fract(uProgress);

    // Kademeli geçiş: her parçacık kendi tohumuna göre biraz geç başlar.
    // Bulut katı bir blok gibi değil, bir akış gibi yeniden dizilir.
    float delay = aSeed * 0.4;
    float f = clamp((raw - delay) / 0.6, 0.0, 1.0);
    f = f * f * (3.0 - 2.0 * f); // smoothstep

    vec3 from = position;
    vec3 to = aStage1;
    if (stage > 0.5 && stage < 1.5)      { from = aStage1; to = aStage2; }
    else if (stage > 1.5 && stage < 2.5) { from = aStage2; to = aStage3; }
    else if (stage > 2.5)                { from = aStage3; to = aStage3; }

    vec3 pos = mix(from, to, f);

    // Duraklarda bile ölü durmasın: çok yavaş, parçacığa özel bir salınım
    float drift = uTime * 0.35 + aSeed * 6.283;
    pos += vec3(sin(drift), cos(drift * 0.83), sin(drift * 0.62)) * 0.035;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Perspektif boyut zayıflaması — uzaktakiler küçülür
    gl_PointSize = uSize * uPixelRatio * (1.0 + aSeed * 0.9) * (8.0 / -mvPosition.z);

    vSeed = aSeed;
    vDepth = -mvPosition.z;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uCold;
  uniform vec3 uWarm;
  uniform float uProgress;
  uniform float uOpacity;

  varying float vSeed;
  varying float vDepth;

  void main() {
    // Kare point sprite'ı yumuşak diske çevir
    vec2 offset = gl_PointCoord - 0.5;
    float dist = length(offset);
    if (dist > 0.5) discard;

    float core = smoothstep(0.5, 0.0, dist);
    float glow = pow(core, 2.6);

    // Anlatının rengi: boru hattı ilerledikçe soğuktan sıcağa.
    // Parçacık başına küçük sapma tek renk düzlüğünü kırar.
    float warmth = clamp(uProgress / 3.0 + (vSeed - 0.5) * 0.14, 0.0, 1.0);
    vec3 color = mix(uCold, uWarm, warmth);

    // Uzaktakiler sönükleşir — atmosferik derinlik
    float depthFade = smoothstep(22.0, 5.0, vDepth);

    float alpha = glow * uOpacity * depthFade * (0.35 + vSeed * 0.65);
    gl_FragColor = vec4(color * (0.75 + glow * 0.6), alpha);
  }
`

interface CloudProps {
  /** 0..3 aralığında hedef ilerleme; ScrollTrigger doğrudan buraya yazar. */
  progressRef: RefObject<number>
  count: number
}

function Cloud({ progressRef, count }: CloudProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const { size } = useThree()

  const geometry = useMemo(() => createDataCloudGeometry(count), [count])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uSize: { value: 5.2 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uCold: { value: COLD },
          uWarm: { value: WARM },
          uOpacity: { value: 0 }, // girişte yumuşakça belirir
        },
        transparent: true,
        depthWrite: false,
        // Toplamalı harman: üst üste binen parçacıklar sönük değil parlak olur
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  // WebGL kaynakları GC edilmez; bileşen sökülürken elle bırakılmalı
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  // Fare paralaksı — hedef değerler, useFrame içinde yumuşatılarak takip edilir
  const pointer = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.current.y = (event.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // Dar ekranda parçacıklar kadraja sığmıyor; bulutu biraz küçült
  const scale = size.width < 768 ? 0.68 : size.width < 1200 ? 0.85 : 1

  useFrame((state, delta) => {
    const uniforms = material.uniforms
    const clamped = Math.min(delta, 0.05) // sekme arka plandayken sıçramasın

    uniforms.uTime.value += clamped
    uniforms.uOpacity.value += (1 - uniforms.uOpacity.value) * clamped * 1.6

    // Scroll hedefine üstel yaklaşma: scrub zaten yumuşak, bu ikinci kat
    // yumuşatma ani sıçramaları (anchor atlama, klavye PageDown) yutar.
    const target = progressRef.current ?? 0
    uniforms.uProgress.value += (target - uniforms.uProgress.value) * clamped * 4.5

    const points = pointsRef.current
    if (!points) return

    // Yavaş kendi ekseninde dönüş + fareye gecikmeli yaslanma
    points.rotation.y += clamped * 0.055
    points.rotation.x += (pointer.current.y * 0.12 - points.rotation.x) * clamped * 2
    points.position.x += (pointer.current.x * 0.35 - points.position.x) * clamped * 2

    // Odak durağında sahne hafifçe yakınlaşır — karar anı vurgulanır
    const zoom = 1 + Math.max(0, uniforms.uProgress.value - 2) * 0.12
    state.camera.position.z += (9.2 / zoom - state.camera.position.z) * clamped * 2
  })

  return (
    <points ref={pointsRef} scale={scale} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </points>
  )
}

/**
 * Nokta bulutu sahnesi.
 *
 * Ana sayfanın arkasında sabit (fixed) durur ve `progressRef` üzerinden
 * ScrollTrigger tarafından sürülür. İlerleme React state'i DEĞİLDİR: her
 * scroll karesinde render tetiklemek 24 bin parçacıkta kare düşürür.
 *
 * `prefers-reduced-motion` açıkken bu bileşen hiç mount edilmez — çağıran
 * taraf (HomePage) karar verir, burada ayrıca kontrol edilmez.
 */
export default function DataCloud({ progressRef }: { progressRef: RefObject<number> }) {
  // Mobilde parçacık sayısı düşürülür; sınır GPU değil dolgu oranı (fill rate).
  const count = useMemo(() => {
    if (typeof window === 'undefined') return 18000
    return window.innerWidth < 768 ? 9000 : 24000
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 0, 9.2], fov: 46 }}
      // dpr üst sınırı 1.75: retina'da 2.0 ile görsel fark yok, maliyet %30 fazla
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <Cloud progressRef={progressRef} count={count} />
    </Canvas>
  )
}
