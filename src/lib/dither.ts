/**
 * Fond animé : bruit fractal tramé (Bayer 8×8) rendu en WebGL basse résolution.
 * Le canvas est agrandi en `image-rendering: pixelated` pour garder l'effet pixel.
 */

const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uMouseOn;
uniform vec3 uCream; uniform vec3 uPale; uniform vec3 uAccent; uniform vec3 uDeep;
uniform float uDensity; uniform float uScroll; uniform float uCenterFade;
uniform vec2 uTap; uniform float uTapAge; uniform float uFlood;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y); }
float fbm(vec2 p){ float v=0.0; float a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=0.5; } return v; }
float bayer2(vec2 a){ a=floor(a); return fract(a.x/2.0+a.y*a.y*0.75); }
float bayer4(vec2 a){ return bayer2(0.5*a)*0.25+bayer2(a); }
float bayer8(vec2 a){ return bayer4(0.5*a)*0.25+bayer2(a); }

void main(){
  vec2 frag=gl_FragCoord.xy;
  vec2 uv=frag/uRes.y + vec2(0.0, uScroll);
  float t=uTime*0.05;
  vec2 q=vec2(fbm(uv*1.4+vec2(0.0,t)), fbm(uv*1.4+vec2(5.2,1.3)-t));
  float f=fbm(uv*2.0+2.2*q+vec2(t*1.4,-t));
  float band=0.5+0.5*sin((uv.x*0.8+uv.y)*5.0-uTime*0.3+f*5.0);
  float v=f*0.9+band*0.3;

  // Onde qui suit la souris
  vec2 m=uMouse/uRes.y; float d=length(frag/uRes.y-m);
  v+=uMouseOn*0.45*exp(-d*d*14.0)*(0.65+0.35*sin(d*36.0-uTime*3.0));
  // Onde lancée par un clic / un toucher
  float tr=uTapAge*0.55; float td=length(frag/uRes.y-uTap/uRes.y);
  v+=step(uTapAge,2.0)*0.7*(1.0-uTapAge*0.5)*exp(-pow((td-tr)*16.0,2.0));

  // Plus d'encre sur les bords qu'au centre (sauf sur mobile)
  float cx=abs(frag.x/uRes.x-0.5)*2.0;
  v*=mix(1.05,mix(0.6,1.12,smoothstep(0.25,1.0,cx)),uCenterFade);
  v+=(1.0-uCenterFade)*0.07;
  v=clamp((v-0.58)*1.35+(uDensity-0.5)*0.7,0.0,1.0);

  // À l'approche du footer, tout le fond vire au bleu
  float fl=smoothstep(0.0,1.0,uFlood);
  v=mix(v,clamp(0.5+fl*0.2+(f-0.5)*0.5*(1.0-fl),0.0,0.665),fl);

  float th=bayer8(frag);
  float lv=v*3.0; float idx=floor(lv)+step(th,fract(lv));
  vec3 col=idx<0.5?uCream:(idx<1.5?uPale:(idx<2.5?uAccent:uDeep));
  gl_FragColor=vec4(col,1.0);
}`

const VERT = 'attribute vec2 p; void main(){ gl_Position=vec4(p,0.0,1.0); }'

const UNIFORMS = [
  'uRes',
  'uTime',
  'uMouse',
  'uMouseOn',
  'uCream',
  'uPale',
  'uAccent',
  'uDeep',
  'uDensity',
  'uScroll',
  'uCenterFade',
  'uTap',
  'uTapAge',
  'uFlood',
] as const
type UniformName = (typeof UNIFORMS)[number]

export interface DitherOptions {
  accent?: string
  pixelSize?: number
  density?: number
  speed?: number
  /** Lu à chaque image : 0 → fond normal, 1 → fond entièrement bleu */
  getFlood?: () => number
  /** Appelé après chaque rendu, pour lire des pixels du canvas si besoin */
  afterDraw?: (renderer: DitherRenderer) => void
}

export interface DitherRenderer {
  /** Luminance moyenne (0–1) du shader autour d'un point de l'écran */
  luminanceAt: (clientX: number, clientY: number) => number
  /**
   * Lit d'un coup les pixels sous un rectangle de l'écran, puis renvoie une fonction
   * qui donne la luminance (0–1) en n'importe quel point de ce rectangle.
   */
  luminanceMap: (rect: DOMRect) => (clientX: number, clientY: number) => number
  destroy: () => void
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h.slice(0, 6)
  const n = parseInt(full, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export function createDither(
  canvas: HTMLCanvasElement,
  options: DitherOptions = {}
): DitherRenderer | null {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: false,
    preserveDrawingBuffer: false,
  })
  if (!gl) return null

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return s
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(prog, n)])) as Record<
    UniformName,
    WebGLUniformLocation | null
  >

  const px = Math.max(1, options.pixelSize ?? 3)
  const accent = hexToRgb(options.accent ?? '#256eff')
  const cream: [number, number, number] = [1, 0.973, 0.941]
  const pale = cream.map((c, i) => c + (accent[i]! - c) * 0.24)
  const deep = accent.map((c) => c * 0.42)
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const speed = reduced ? 0 : (options.speed ?? 1)

  const mouse = { x: -9999, y: -9999, on: 0, target: 0 }
  let tap: { x: number; y: number; age: number } | null = null
  let t = 0
  let flood = 0
  let last = performance.now()
  let raf = 0

  let sizedW = 0
  let sizedH = 0
  const resize = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    // Sur mobile, la barre d'adresse qui se replie change la hauteur pendant le scroll :
    // redimensionner le canvas à chaque fois l'efface et le fait clignoter. On ignore
    // ces petites variations de hauteur tant que la largeur ne change pas.
    if (w === sizedW && Math.abs(h - sizedH) < 160) return
    sizedW = w
    sizedH = h
    canvas.width = Math.ceil(w / px)
    canvas.height = Math.ceil(h / px)
    gl.viewport(0, 0, canvas.width, canvas.height)
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    mouse.x = e.clientX
    mouse.y = e.clientY
    mouse.target = 1
  }
  const onDown = (e: PointerEvent) => {
    tap = { x: e.clientX, y: e.clientY, age: 0 }
  }
  const onLeave = () => {
    mouse.target = 0
  }

  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerdown', onDown, { passive: true })
  document.addEventListener('pointerleave', onLeave)

  const renderer: DitherRenderer = {
    luminanceAt(clientX, clientY) {
      const w = canvas.width
      const h = canvas.height
      const cx = Math.max(0, Math.min(w - 4, Math.floor(clientX / px) - 2))
      const cy = Math.max(0, Math.min(h - 4, Math.floor(h - clientY / px) - 2))
      const data = new Uint8Array(4 * 4 * 4)
      gl.readPixels(cx, cy, 4, 4, gl.RGBA, gl.UNSIGNED_BYTE, data)
      let lum = 0
      for (let i = 0; i < 16; i++) {
        lum += (0.2126 * data[i * 4]! + 0.7152 * data[i * 4 + 1]! + 0.0722 * data[i * 4 + 2]!) / 255
      }
      return lum / 16
    },
    luminanceMap(rect) {
      const w = canvas.width
      const h = canvas.height
      const x0 = Math.max(0, Math.floor(rect.left / px) - 1)
      const x1 = Math.min(w, Math.ceil(rect.right / px) + 1)
      const y0 = Math.max(0, Math.floor(h - rect.bottom / px) - 1)
      const y1 = Math.min(h, Math.ceil(h - rect.top / px) + 1)
      const rw = Math.max(1, x1 - x0)
      const rh = Math.max(1, y1 - y0)
      const data = new Uint8Array(rw * rh * 4)
      gl.readPixels(x0, y0, rw, rh, gl.RGBA, gl.UNSIGNED_BYTE, data)

      return (clientX, clientY) => {
        // Moyenne sur 2×2 pixels du shader autour du point
        const cx = Math.floor(clientX / px) - x0
        const cy = Math.floor(h - clientY / px) - y0
        let lum = 0
        let n = 0
        for (let dy = -1; dy <= 0; dy++) {
          for (let dx = -1; dx <= 0; dx++) {
            const x = Math.min(rw - 1, Math.max(0, cx + dx))
            const y = Math.min(rh - 1, Math.max(0, cy + dy))
            const i = (y * rw + x) * 4
            lum += (0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!) / 255
            n++
          }
        }
        return lum / n
      }
    },
    destroy() {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerleave', onLeave)
    },
  }

  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    t += dt * speed
    mouse.on += (mouse.target - mouse.on) * Math.min(1, dt * 4)
    if (tap) tap.age += dt
    flood += ((options.getFlood?.() ?? 0) - flood) * Math.min(1, dt * 6)

    const w = canvas.width
    const h = canvas.height
    gl.uniform2f(u.uRes, w, h)
    gl.uniform1f(u.uTime, t + 12)
    gl.uniform2f(u.uMouse, mouse.x / px, h - mouse.y / px)
    gl.uniform1f(u.uMouseOn, mouse.on)
    gl.uniform3fv(u.uCream, cream)
    gl.uniform3fv(u.uPale, pale)
    gl.uniform3fv(u.uAccent, accent)
    gl.uniform3fv(u.uDeep, deep)
    gl.uniform1f(u.uDensity, options.density ?? 0.55)
    gl.uniform1f(u.uScroll, (window.scrollY / Math.max(1, window.innerHeight)) * 0.35)
    gl.uniform1f(u.uCenterFade, window.innerWidth <= 640 ? 0 : 1)
    gl.uniform2f(u.uTap, tap ? tap.x / px : -9999, tap ? h - tap.y / px : -9999)
    gl.uniform1f(u.uTapAge, tap ? tap.age : 99)
    gl.uniform1f(u.uFlood, flood)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    // Les pixels ne sont lisibles que juste après le rendu, dans la même image
    options.afterDraw?.(renderer)
    raf = requestAnimationFrame(frame)
  }

  resize()
  raf = requestAnimationFrame(frame)
  return renderer
}
