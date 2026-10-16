import { useEffect, useRef, useState, type RefObject } from 'react'
import { createDither, type DitherRenderer } from '../lib/dither'

interface DitherBackgroundProps {
  floodRef: RefObject<number>
  /** Élément dont on veut adapter la couleur au fond (l'indicateur de scroll) */
  probeRef: RefObject<HTMLElement | null>
  /** Mobile : canvas placé dans l'espace entre la colonne et le footer */
  gapRef: RefObject<HTMLCanvasElement | null>
}

const MOBILE_QUERY = '(max-width: 640px)'
/** On relit les pixels toutes les 3 images pour suivre le shader de près */
const SAMPLE_EVERY = 3
/** Seuils avec une petite marge, pour ne pas clignoter sur la trame */
const DARK_BELOW = 0.58
const LIGHT_ABOVE = 0.66

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}

/**
 * Desktop : un canvas fixé derrière la colonne.
 *
 * Mobile : deux petits canvas posés dans la page, l'un dans la bande au-dessus du hero,
 * l'autre dans l'espace avant le footer. Ils défilent avec le contenu, nativement :
 * pas de découpe recalculée en JavaScript qui prendrait du retard pendant un scroll
 * rapide sur iOS, et pas de motif qui glisse à une autre vitesse que la page.
 */
export function DitherBackground({ floodRef, probeRef, gapRef }: DitherBackgroundProps) {
  const mainRef = useRef<HTMLCanvasElement>(null)
  const mobile = useIsMobile()

  useEffect(() => {
    const main = mainRef.current
    const gap = gapRef.current
    if (!main) return

    let tick = 0
    const canvases = mobile && gap ? [main, gap] : [main]

    /** Qu'y a-t-il sous ce point ? (l'indicateur ne capte pas le pointeur) */
    const surfaceAt = (x: number, y: number): HTMLCanvasElement | 'footer' | 'page' => {
      const under = document.elementFromPoint(x, y)
      if (under?.closest('[data-footer]')) return 'footer'
      const c = canvases.find((el) => el === under)
      return c ?? 'page'
    }

    /** Chaque trait et le pourcentage prennent la couleur du pixel juste dessous */
    const sample = (r: DitherRenderer, own: HTMLCanvasElement) => {
      const probe = probeRef.current
      if (!probe) return
      const rect = probe.getBoundingClientRect()
      if (!rect.width) return

      // Mobile : petit fond crème quand l'indicateur passe sur le texte de la page
      const center = surfaceAt(rect.left + rect.width / 2, rect.top + rect.height / 2)
      const surfaceName = center === 'footer' || center === 'page' ? center : 'shader'
      if (probe.dataset.surface !== surfaceName) probe.dataset.surface = surfaceName

      let lumAt: ((x: number, y: number) => number) | null = null
      probe.querySelectorAll<HTMLElement>('[data-ink]').forEach((el) => {
        const b = el.getBoundingClientRect()
        const x = b.left + b.width / 2
        const y = b.top + b.height / 2
        const surface = surfaceAt(x, y)
        if (surface !== 'footer' && surface !== 'page' && surface !== own) return // l'autre canvas s'en charge
        const was = el.dataset.light === '1'
        let light = was
        if (surface === 'footer') light = true
        else if (surface === 'page') light = false
        else {
          lumAt ??= r.luminanceMap(rect)
          const lum = lumAt(x, y)
          if (lum < DARK_BELOW) light = true
          else if (lum > LIGHT_ABOVE) light = false
        }
        if (light !== was) el.dataset.light = light ? '1' : '0'
      })
    }

    // Mobile : on ne dessine un canvas que lorsqu'il est à l'écran
    const visible = new Map<Element, boolean>(canvases.map((c) => [c, !mobile]))
    const io = mobile
      ? new IntersectionObserver((entries) => {
          for (const e of entries) visible.set(e.target, e.isIntersecting)
        })
      : null
    canvases.forEach((c) => io?.observe(c))

    const make = (canvas: HTMLCanvasElement, opts: { flood: boolean; scroll?: number }) =>
      createDither(canvas, {
        getFlood: opts.flood ? () => floodRef.current ?? 0 : undefined,
        // Mobile : même échelle de motif pour les deux canvas, quelle que soit leur hauteur
        getRefHeight: mobile ? () => window.innerHeight : undefined,
        getScroll: opts.scroll !== undefined ? () => opts.scroll! : undefined,
        isActive: mobile ? () => visible.get(canvas) ?? true : undefined,
        afterDraw: (r) => {
          tick = (tick + 1) % SAMPLE_EVERY
          if (tick === 0) sample(r, canvas)
        },
      })

    const renderers = mobile
      ? [make(main, { flood: false, scroll: 0 }), gap ? make(gap, { flood: true, scroll: 2.3 }) : null]
      : [make(main, { flood: true })]

    return () => {
      renderers.forEach((r) => r?.destroy())
      io?.disconnect()
    }
  }, [mobile, floodRef, probeRef, gapRef])

  return (
    <canvas
      key={mobile ? 'top' : 'fixed'}
      ref={mainRef}
      className={mobile ? 'dither-top' : 'dither-canvas'}
      aria-hidden="true"
    />
  )
}
