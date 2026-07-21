import { useEffect, useRef } from 'react'

/* ---------------------------------------------------------------------------
   Akışkan zemin — GPU üzerinde Navier-Stokes (Stable Fluids) çözücüsü.
   İmleç hıza kuvvet enjekte eder, çözücü bunu girdaplara çevirir; ekranda
   imlecin arkasında dağılan bir sıvı izi kalır.

   Adım sırası (her karede):
     splat → curl → vorticity → divergence → pressure (Jacobi × N)
     → gradientSubtract → advect
   Bu, sıkıştırılamazlık koşulunu (∇·u = 0) sağlayan standart sıradır;
   basınç projeksiyonu atlanırsa sıvı değil yalnızca "bulaşan iz" elde edilir.

   Renk, projenin anlatısal eksenine bağlıdır: sayfa başında soğuk camgöbeği,
   aşağı inildikçe sıcak amber (bkz. index.css → "görsel dil").
--------------------------------------------------------------------------- */

const SIM_RESOLUTION = 128
const DYE_RESOLUTION = 512
const PRESSURE_ITERATIONS = 12
const VELOCITY_DISSIPATION = 0.28
const DENSITY_DISSIPATION = 1.45
const PRESSURE_DECAY = 0.8
const CURL_STRENGTH = 26
const SPLAT_RADIUS = 0.0025

const COLD: [number, number, number] = [0.27, 0.78, 0.94]
const WARM: [number, number, number] = [1.0, 0.64, 0.1]

const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

const HEAD = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 fragColor;
`

const SPLAT = `${HEAD}
uniform sampler2D uTarget; uniform float aspectRatio;
uniform vec3 color; uniform vec2 point; uniform float radius;
void main () {
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture(uTarget, vUv).xyz;
  fragColor = vec4(base + splat, 1.0);
}`

const ADVECTION = `${HEAD}
uniform sampler2D uVelocity; uniform sampler2D uSource;
uniform vec2 texelSize; uniform float dt; uniform float dissipation;
void main () {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  fragColor = texture(uSource, coord) / (1.0 + dissipation * dt);
}`

const DIVERGENCE = `${HEAD}
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`

const CURL = `${HEAD}
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`

const VORTICITY = `${HEAD}
uniform sampler2D uVelocity; uniform sampler2D uCurl;
uniform float curl; uniform float dt;
void main () {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture(uVelocity, vUv).xy + force * dt;
  velocity = min(max(velocity, -1000.0), 1000.0);
  fragColor = vec4(velocity, 0.0, 1.0);
}`

const PRESSURE = `${HEAD}
uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  fragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}`

const GRADIENT_SUBTRACT = `${HEAD}
uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}`

const CLEAR = `${HEAD}
uniform sampler2D uTexture; uniform float value;
void main () { fragColor = value * texture(uTexture, vUv); }`

const DISPLAY = `${HEAD}
uniform sampler2D uTexture;
void main () {
  vec3 c = texture(uTexture, vUv).rgb;
  // Kenarlara doğru yumuşak sönüm — sıvı, ekran kenarında sert kesilmesin.
  vec2 d = abs(vUv - 0.5) * 2.0;
  float vignette = smoothstep(1.15, 0.35, max(d.x, d.y));
  c *= vignette;
  float a = clamp(max(max(c.r, c.g), c.b), 0.0, 1.0);
  fragColor = vec4(c, a);
}`

interface Fbo {
  texture: WebGLTexture
  fbo: WebGLFramebuffer
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
}

interface DoubleFbo {
  read: Fbo
  write: Fbo
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  swap: () => void
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (import.meta.env.DEV) console.error('Akışkan gölgelendirici derlenemedi:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl: WebGL2RenderingContext, fragSource: string) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERT)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragSource)
  if (!vertex || !fragment) return null
  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (import.meta.env.DEV) console.error('Akışkan programı bağlanamadı:', gl.getProgramInfoLog(program))
    return null
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {}
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number
  for (let i = 0; i < count; i++) {
    const name = gl.getActiveUniform(program, i)?.name
    if (name) uniforms[name] = gl.getUniformLocation(program, name)
  }
  return { program, uniforms }
}

type Program = NonNullable<ReturnType<typeof createProgram>>

/**
 * İmleçle karışan akışkan zemin.
 *
 * WebGL2 + float render hedefi gerektirir; ikisinden biri yoksa hiçbir şey
 * kurulmaz ve bileşen sessizce boş döner (sayfa bundan etkilenmez — zemin
 * yalnızca karbon rengi kalır). `prefers-reduced-motion` kontrolü çağıran
 * tarafta yapılır (bkz. HomePage).
 */
export default function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const warmthRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    })
    if (!gl) return
    if (!gl.getExtension('EXT_color_buffer_float')) return
    gl.getExtension('OES_texture_float_linear')

    // --- Tam ekran dörtgen ---------------------------------------------
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW)
    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(0)

    const programs = {
      splat: createProgram(gl, SPLAT),
      advection: createProgram(gl, ADVECTION),
      divergence: createProgram(gl, DIVERGENCE),
      curl: createProgram(gl, CURL),
      vorticity: createProgram(gl, VORTICITY),
      pressure: createProgram(gl, PRESSURE),
      gradientSubtract: createProgram(gl, GRADIENT_SUBTRACT),
      clear: createProgram(gl, CLEAR),
      display: createProgram(gl, DISPLAY),
    }
    if (Object.values(programs).some((p) => p === null)) return
    const prog = programs as Record<keyof typeof programs, Program>

    const blit = (target: Fbo | null) => {
      if (target) {
        gl.viewport(0, 0, target.width, target.height)
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
      } else {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
    }

    const createFbo = (w: number, h: number, internal: number, format: number): Fbo => {
      const texture = gl.createTexture()!
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null)
      const fbo = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      return { texture, fbo, width: w, height: h, texelSizeX: 1 / w, texelSizeY: 1 / h }
    }

    const createDouble = (w: number, h: number, internal: number, format: number): DoubleFbo => {
      let fbo1 = createFbo(w, h, internal, format)
      let fbo2 = createFbo(w, h, internal, format)
      return {
        width: w,
        height: h,
        texelSizeX: 1 / w,
        texelSizeY: 1 / h,
        get read() {
          return fbo1
        },
        get write() {
          return fbo2
        },
        swap() {
          const temp = fbo1
          fbo1 = fbo2
          fbo2 = temp
        },
      }
    }

    // DİKKAT: tuvalin düzen ölçüsü (clientWidth/Height) bu noktada 0 olabilir —
    // bileşen lazy yüklendiği için ilk yerleşim henüz oturmamış olabiliyor.
    // 0'a bölünce dokuların bir kenarı Infinity olur ve BÜTÜN framebuffer'lar
    // "incomplete" doğar; hiçbir çizim işlemi çalışmaz (GL hatası 1286).
    // Bu yüzden ölçüyü her zaman pencereden türetiyor ve sonlu/pozitif
    // olduğunu garantiye alıyoruz.
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cssW = canvas.clientWidth || window.innerWidth || 1
      const cssH = canvas.clientHeight || window.innerHeight || 1
      canvas.width = Math.max(1, Math.round(cssW * dpr))
      canvas.height = Math.max(1, Math.round(cssH * dpr))
    }
    resize()

    const aspect = canvas.width / canvas.height
    const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1
    const sized = (base: number) => ({
      w: Math.max(1, Math.round(safeAspect > 1 ? base * safeAspect : base)),
      h: Math.max(1, Math.round(safeAspect > 1 ? base : base / safeAspect)),
    })
    const dyeSize = sized(DYE_RESOLUTION)
    const simSize = sized(SIM_RESOLUTION)
    const dyeW = dyeSize.w
    const dyeH = dyeSize.h
    const simW = simSize.w
    const simH = simSize.h

    const dye = createDouble(dyeW, dyeH, gl.RGBA16F, gl.RGBA)
    const velocity = createDouble(simW, simH, gl.RG16F, gl.RG)
    const divergence = createFbo(simW, simH, gl.R16F, gl.RED)
    const curl = createFbo(simW, simH, gl.R16F, gl.RED)
    const pressure = createDouble(simW, simH, gl.R16F, gl.RED)

    const bind = (target: Fbo, unit: number) => {
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, target.texture)
      return unit
    }

    // --- İşaretçi durumu ------------------------------------------------
    const pointer = { x: 0.5, y: 0.5, dx: 0, dy: 0, moved: false }

    const splat = (x: number, y: number, dx: number, dy: number, color: [number, number, number]) => {
      gl.useProgram(prog.splat.program)
      gl.uniform1i(prog.splat.uniforms.uTarget, bind(velocity.read, 0))
      gl.uniform1f(prog.splat.uniforms.aspectRatio, canvas.width / canvas.height)
      gl.uniform2f(prog.splat.uniforms.point, x, y)
      gl.uniform3f(prog.splat.uniforms.color, dx, dy, 0)
      gl.uniform1f(prog.splat.uniforms.radius, SPLAT_RADIUS)
      blit(velocity.write)
      velocity.swap()

      gl.uniform1i(prog.splat.uniforms.uTarget, bind(dye.read, 0))
      gl.uniform3f(prog.splat.uniforms.color, color[0], color[1], color[2])
      blit(dye.write)
      dye.swap()
    }

    const step = (dt: number) => {
      gl.disable(gl.BLEND)

      // curl
      gl.useProgram(prog.curl.program)
      gl.uniform2f(prog.curl.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(prog.curl.uniforms.uVelocity, bind(velocity.read, 0))
      blit(curl)

      // vorticity confinement
      gl.useProgram(prog.vorticity.program)
      gl.uniform2f(prog.vorticity.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(prog.vorticity.uniforms.uVelocity, bind(velocity.read, 0))
      gl.uniform1i(prog.vorticity.uniforms.uCurl, bind(curl, 1))
      gl.uniform1f(prog.vorticity.uniforms.curl, CURL_STRENGTH)
      gl.uniform1f(prog.vorticity.uniforms.dt, dt)
      blit(velocity.write)
      velocity.swap()

      // divergence
      gl.useProgram(prog.divergence.program)
      gl.uniform2f(prog.divergence.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(prog.divergence.uniforms.uVelocity, bind(velocity.read, 0))
      blit(divergence)

      // basıncı söndür, sonra Jacobi ile çöz
      gl.useProgram(prog.clear.program)
      gl.uniform1i(prog.clear.uniforms.uTexture, bind(pressure.read, 0))
      gl.uniform1f(prog.clear.uniforms.value, PRESSURE_DECAY)
      blit(pressure.write)
      pressure.swap()

      gl.useProgram(prog.pressure.program)
      gl.uniform2f(prog.pressure.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(prog.pressure.uniforms.uDivergence, bind(divergence, 0))
      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(prog.pressure.uniforms.uPressure, bind(pressure.read, 1))
        blit(pressure.write)
        pressure.swap()
      }

      // basınç gradyanını çıkar → sıkıştırılamaz alan
      gl.useProgram(prog.gradientSubtract.program)
      gl.uniform2f(prog.gradientSubtract.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(prog.gradientSubtract.uniforms.uPressure, bind(pressure.read, 0))
      gl.uniform1i(prog.gradientSubtract.uniforms.uVelocity, bind(velocity.read, 1))
      blit(velocity.write)
      velocity.swap()

      // taşıma (advection)
      gl.useProgram(prog.advection.program)
      gl.uniform2f(prog.advection.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(prog.advection.uniforms.uVelocity, bind(velocity.read, 0))
      gl.uniform1i(prog.advection.uniforms.uSource, bind(velocity.read, 0))
      gl.uniform1f(prog.advection.uniforms.dt, dt)
      gl.uniform1f(prog.advection.uniforms.dissipation, VELOCITY_DISSIPATION)
      blit(velocity.write)
      velocity.swap()

      gl.uniform1i(prog.advection.uniforms.uVelocity, bind(velocity.read, 0))
      gl.uniform1i(prog.advection.uniforms.uSource, bind(dye.read, 1))
      gl.uniform1f(prog.advection.uniforms.dissipation, DENSITY_DISSIPATION)
      blit(dye.write)
      dye.swap()
    }

    const render = () => {
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.useProgram(prog.display.program)
      gl.uniform1i(prog.display.uniforms.uTexture, bind(dye.read, 0))
      blit(null)
    }

    window.addEventListener('resize', resize)

    const currentColor = (intensity: number): [number, number, number] => {
      const w = warmthRef.current
      return [
        (COLD[0] + (WARM[0] - COLD[0]) * w) * intensity,
        (COLD[1] + (WARM[1] - COLD[1]) * w) * intensity,
        (COLD[2] + (WARM[2] - COLD[2]) * w) * intensity,
      ]
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = 1 - (event.clientY - rect.top) / rect.height
      pointer.dx = (x - pointer.x) * 5000
      pointer.dy = (y - pointer.y) * 5000
      pointer.x = x
      pointer.y = y
      pointer.moved = true
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    // Sayfadaki dikey konum sıvının sıcaklığını belirler: üstte camgöbeği,
    // aşağıda amber. Anlatı ekseni burada da geçerli.
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      warmthRef.current = max > 0 ? Math.min(1, window.scrollY / max) : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    let raf = 0
    let last = performance.now()
    let idleTimer = 0

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.0166)
      last = now

      if (pointer.moved) {
        pointer.moved = false
        const speed = Math.hypot(pointer.dx, pointer.dy)
        splat(pointer.x, pointer.y, pointer.dx, pointer.dy, currentColor(Math.min(0.5, speed * 0.00035)))
        idleTimer = 0
      } else {
        // Boşta kalınca ara ara kendiliğinden küçük bir dalga — sıvı ölü
        // görünmesin. İmleç hareket ettiği anda susar.
        idleTimer += dt
        if (idleTimer > 2.6) {
          idleTimer = 0
          const rx = 0.2 + Math.random() * 0.6
          const ry = 0.2 + Math.random() * 0.6
          const angle = Math.random() * Math.PI * 2
          splat(rx, ry, Math.cos(angle) * 900, Math.sin(angle) * 900, currentColor(0.16))
        }
      }

      step(dt)
      render()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // Geliştirme derlemesinde elle adımlayıp doğrulayabilmek için.
    if (import.meta.env.DEV) {
      Object.assign(window as unknown as Record<string, unknown>, {
        __fluid: {
          step,
          render,
          splat,
          gl,
          fbos: { dye, velocity, divergence, curl, pressure },
          status: () => {
            const check = (name: string, target: Fbo) => {
              gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
              return `${name}:${gl.checkFramebufferStatus(gl.FRAMEBUFFER)} (${target.width}x${target.height})`
            }
            return [
              check('dye', dye.read),
              check('velocity', velocity.read),
              check('divergence', divergence),
              check('curl', curl),
              check('pressure', pressure.read),
              `COMPLETE=${gl.FRAMEBUFFER_COMPLETE}`,
            ]
          },
          readVelocity: () => {
            const out = new Float32Array(4)
            gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.read.fbo)
            gl.readPixels(
              Math.floor(velocity.read.width / 2),
              Math.floor(velocity.read.height / 2),
              1,
              1,
              gl.RGBA,
              gl.FLOAT,
              out,
            )
            return Array.from(out)
          },
        },
      })
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden="true"
    />
  )
}
