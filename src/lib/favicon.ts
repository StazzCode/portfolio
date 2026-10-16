/**
 * Icône d'onglet animée : une sphère tramée (Bayer 4×4) qui tourne, aux couleurs du site.
 * Dessinée en 32×32 pixels sur un canvas, puis envoyée comme favicon plusieurs fois par
 * seconde. Les navigateurs qui ignorent les favicons dynamiques (Safari) gardent
 * l'icône fixe déclarée dans index.html.
 */

const SIZE = 32
const SCALE = 2 // canvas 64×64 pour un rendu net sur écran Retina
const FPS = 20
/** Vitesse de rotation (radians par seconde) */
const SPEED = 2.4

// Du plus sombre au plus clair
const PALETTE = ['#0f2e6b', '#256eff', '#9dbcff', '#ffffff']

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16))

/** Niveau de couleur (0–3) d'un pixel de la sphère, ou -1 hors sphère */
export function spherePixel(px: number, py: number, t: number): number {
  // Centre du pixel ramené dans [-1, 1]
  const x = ((px + 0.5) / SIZE) * 2 - 1
  const y = ((py + 0.5) / SIZE) * 2 - 1
  const r2 = x * x + y * y
  if (r2 > 0.94) return -1
  const z = Math.sqrt(1 - Math.min(1, r2))

  // Lumière qui balaie la face avant de gauche à droite, légèrement en haut :
  // la sphère n'est jamais entièrement dans l'ombre (lisible sur un onglet sombre)
  const lx = Math.sin(t) * 0.85
  const ly = -0.55
  const lz = 0.75 + 0.25 * Math.cos(t)
  const ll = Math.hypot(lx, ly, lz)
  const diffuse = Math.max(0, (x * lx + y * ly + z * lz) / ll)

  // Bandes de longitude qui défilent : la sphère semble tourner sur elle-même
  const lon = Math.atan2(x, z) + t * 0.9
  const band = Math.sin(lon * 3 + y * 1.5)

  const v = 0.1 + diffuse * 0.68 + band * 0.1
  const threshold = BAYER4[py % 4]![px % 4]!
  return Math.max(0, Math.min(3, Math.floor(v * 3 + threshold)))
}

/**
 * Horloge dans un worker : Chrome ralentit fortement les minuteurs d'un onglet en
 * arrière-plan (jusqu'à une fois par minute), mais pas ceux d'un worker. Or c'est
 * justement quand on regarde un autre onglet que l'icône est visible.
 */
function createTicker(fps: number, onTick: () => void): () => void {
  try {
    const src = `setInterval(() => postMessage(0), ${Math.round(1000 / fps)})`
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }))
    const worker = new Worker(url)
    worker.onmessage = onTick
    return () => {
      worker.terminate()
      URL.revokeObjectURL(url)
    }
  } catch {
    // Workers indisponibles : simple minuteur
    const id = window.setInterval(onTick, 1000 / fps)
    return () => window.clearInterval(id)
  }
}

export function startDitherFavicon(): () => void {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE * SCALE
  canvas.height = SIZE * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced) return () => {} // on garde l'icône fixe de index.html

  // Un seul <link rel="icon"> : l'icône fixe est retirée pendant l'animation,
  // sinon Chrome peut continuer à afficher la version SVG fixe
  const staticIcons = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')]
  staticIcons.forEach((el) => el.remove())
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/png'
  document.head.appendChild(link)

  const draw = (t: number) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let py = 0; py < SIZE; py++) {
      for (let px = 0; px < SIZE; px++) {
        const level = spherePixel(px, py, t)
        if (level < 0) continue
        ctx.fillStyle = PALETTE[level]!
        ctx.fillRect(px * SCALE, py * SCALE, SCALE, SCALE)
      }
    }
    link.href = canvas.toDataURL('image/png')
  }

  const start = performance.now()
  draw(0.6)
  const stop = createTicker(FPS, () => draw(0.6 + ((performance.now() - start) / 1000) * SPEED))

  return () => {
    stop()
    link.remove()
    staticIcons.forEach((el) => document.head.appendChild(el))
  }
}
