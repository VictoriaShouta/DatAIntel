import * as THREE from 'three'

/**
 * Nokta bulutunun dört durağı.
 *
 * Her durak boru hattının bir aşamasını temsil eder ve aynı parçacık kümesi
 * duraklar arasında yeniden konumlanır (morph). Sıra anlatısaldır:
 *
 *   0 · KÜRE     — ham, yapılandırılmamış veri; yön yok, hepsi eşit uzaklıkta
 *   1 · IZGARA   — satır/sütuna oturmuş, sorgulanabilir hale gelmiş veri
 *   2 · ÇUBUKLAR — çözümlenmiş veri; artık bir dağılımı, bir şekli var
 *   3 · ODAK     — tek bir karara yakınsama; kalanı iz olarak arkada bırakır
 *
 * Konumlar bir kez hesaplanıp attribute olarak GPU'ya gider; scroll ilerledikçe
 * sadece bir uniform (uProgress) değişir. CPU her karede hiçbir şey hesaplamaz.
 */

/** Deterministik sözde-rastgele — her yüklemede aynı bulut çıksın diye. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    // xorshift32
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 100000) / 100000
  }
}

/** 0 · Küre — Fibonacci dağılımı, kabuğa hafif kalınlık verilir. */
function sphereStage(count: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    // Kabuk kalınlığı: tek bir kâğıt-ince yüzey yerine hacim hissi verir
    const r = 2.45 + rand() * 0.35

    out[i * 3] = Math.cos(theta) * ringRadius * r
    out[i * 3 + 1] = y * r
    out[i * 3 + 2] = Math.sin(theta) * ringRadius * r
  }
  return out
}

/** 1 · Izgara — satır ve sütunlara oturmuş düzlem, hafif derinlik dalgası. */
function gridStage(count: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3)
  const cols = Math.ceil(Math.sqrt(count * 1.9))
  const rows = Math.ceil(count / cols)

  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)

    const x = (col / (cols - 1) - 0.5) * 7.2
    const y = (row / (rows - 1) - 0.5) * 3.8
    // Izgara ölü düz olursa cansız görünür; çok yavaş bir dalga derinlik verir
    const z = Math.sin(x * 0.55) * 0.22 + Math.cos(y * 0.8) * 0.18 + (rand() - 0.5) * 0.05

    out[i * 3] = x
    out[i * 3 + 1] = y
    out[i * 3 + 2] = z
  }
  return out
}

/**
 * 2 · Çubuklar — çözümlenmiş dağılım.
 * Yükseklikler sabit bir fonksiyondan gelir: mevsimsel bir dalga + trend.
 * Sentetik veri üretecinin ürettiği şeklin görsel karşılığı.
 */
function barsStage(count: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3)
  const barCount = 22
  const perBar = Math.floor(count / barCount)
  const baseY = -1.9

  for (let i = 0; i < count; i++) {
    const bar = Math.min(barCount - 1, Math.floor(i / perBar))
    const t = bar / (barCount - 1)

    // mevsimsellik + yükselen trend + sabit taban
    const height = 0.6 + Math.abs(Math.sin(t * Math.PI * 2.1)) * 1.9 + t * 1.4

    const x = (t - 0.5) * 7.0
    const localX = (rand() - 0.5) * 0.2
    const localZ = (rand() - 0.5) * 0.34

    out[i * 3] = x + localX
    out[i * 3 + 1] = baseY + rand() * height
    out[i * 3 + 2] = localZ
  }
  return out
}

/**
 * 3 · Odak — karara yakınsama.
 * Parçacıkların çoğu sıkı bir çekirdekte toplanır; kalanı yukarı-sağa uzanan
 * ince bir iz bırakır. "Gürültüden tek bir yöne" okunur.
 */
function focusStage(count: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const inCore = rand() < 0.62

    if (inCore) {
      // Yoğun küresel çekirdek — merkeze doğru kübik yığılma
      const u = rand()
      const r = 0.42 * u * u * u
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(2 * rand() - 1)

      out[i * 3] = Math.sin(phi) * Math.cos(theta) * r
      out[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r + 0.15
      out[i * 3 + 2] = Math.cos(phi) * r
    } else {
      // Çekirdeğe akan iz: uzaklaştıkça hem seyrelir hem dağılır
      const t = rand()
      const spread = 0.06 + t * 0.5
      out[i * 3] = -3.6 * t + (rand() - 0.5) * spread
      out[i * 3 + 1] = -1.5 * t + 0.15 + (rand() - 0.5) * spread
      out[i * 3 + 2] = (rand() - 0.5) * spread * 1.4
    }
  }
  return out
}

/**
 * Dört durağı da içeren tek geometri.
 * `aStage1..3` ek attribute'lar; `position` sıfırıncı duraktır (küre) ve
 * frustum culling'in doğru çalışması için bounding sphere elle verilir.
 */
export function createDataCloudGeometry(count: number): THREE.BufferGeometry {
  const rand = makeRandom(0x5eed1234)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(sphereStage(count, rand), 3))
  geometry.setAttribute('aStage1', new THREE.BufferAttribute(gridStage(count, rand), 3))
  geometry.setAttribute('aStage2', new THREE.BufferAttribute(barsStage(count, rand), 3))
  geometry.setAttribute('aStage3', new THREE.BufferAttribute(focusStage(count, rand), 3))

  // Parçacık başına sabit rastgele: geçişte kademe (stagger) ve boyut/parlaklık
  // varyasyonu için. Hepsi aynı anda hareket ederse katı bir blok gibi görünür.
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) seeds[i] = rand()
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

  // Duraklar arasında geometri sınırları değişiyor; en geniş duruma göre sabitle
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 5)

  return geometry
}
