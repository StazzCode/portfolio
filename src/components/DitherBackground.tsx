import { useEffect, useRef, type RefObject } from 'react'
import { createDither } from '../lib/dither'

interface DitherBackgroundProps {
  floodRef: RefObject<number>
  /** Élément dont on veut connaître le fond (l'indicateur de scroll) */
  probeRef: RefObject<HTMLElement | null>
  /** Mobile : true quand le fond sous l'indicateur est bleu (encre claire nécessaire) */
  onProbe: (light: boolean) => void
}

const MOBILE_MAX = 640
/** Grand écran : on relit les pixels toutes les 3 images pour suivre le shader de près */
const DESKTOP_EVERY = 3
/** Mobile : l'indicateur a son propre fond, une lecture plus espacée suffit */
const MOBILE_EVERY = 10
/** Seuils avec une petite marge, pour ne pas clignoter sur la trame */
const DARK_BELOW = 0.58
const LIGHT_ABOVE = 0.66

export function DitherBackground({ floodRef, probeRef, onProbe }: DitherBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onProbeRef = useRef(onProbe)
  onProbeRef.current = onProbe

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let tick = 0
    let current: boolean | null = null
    let votes = 0

    /** Qu'y a-t-il sous ce point ? (l'indicateur ne capte pas le pointeur) */
    const surfaceAt = (x: number, y: number) => {
      const under = document.elementFromPoint(x, y)
      if (under?.closest('[data-footer]')) return 'footer'
      if (under === canvas) return 'shader'
      return 'page'
    }

    /**
     * Mobile : la colonne est transparente pour laisser voir le shader en haut.
     * Lors d'un scroll rapide, iOS affiche le contenu avec un temps de retard et le
     * shader apparaît à travers. On découpe donc le canvas pour qu'il n'existe que
     * là où il doit être vu : la bande au-dessus du hero et la zone avant le footer.
     * Ailleurs, c'est le fond crème de la page qui est derrière.
     */
    let lastClip = ''
    const updateClip = () => {
      let clip = 'none'
      if (window.innerWidth <= MOBILE_MAX) {
        const h = window.innerHeight
        const heroTop = document.querySelector('.hero-card')?.getBoundingClientRect().top ?? 0
        const sheetBottom = document.querySelector('.sheet')?.getBoundingClientRect().bottom ?? h
        const top = heroTop > 0 // bande du haut visible
        const bottom = sheetBottom < h // zone avant le footer visible
        if (top && bottom) clip = 'none'
        else if (top) clip = `inset(0 0 ${Math.max(0, h - heroTop)}px 0)`
        else if (bottom) clip = `inset(${Math.max(0, sheetBottom)}px 0 0 0)`
        else clip = 'inset(0 0 100% 0)'
      }
      if (clip !== lastClip) {
        canvas.style.clipPath = clip
        lastClip = clip
      }
    }
    window.addEventListener('scroll', updateClip, { passive: true })
    window.addEventListener('resize', updateClip)
    updateClip()

    const renderer = createDither(canvas, {
      getFlood: () => floodRef.current ?? 0,
      afterDraw: (r) => {
        updateClip()
        const probe = probeRef.current
        if (!probe) return
        const desktop = window.innerWidth > MOBILE_MAX
        tick = (tick + 1) % (desktop ? DESKTOP_EVERY : MOBILE_EVERY)
        if (tick !== 0) return

        const rect = probe.getBoundingClientRect()
        if (!rect.width) return

        if (desktop) {
          // Chaque trait et le pourcentage prennent la couleur du pixel juste dessous
          const lumAt = r.luminanceMap(rect)
          probe.querySelectorAll<HTMLElement>('[data-ink]').forEach((el) => {
            const b = el.getBoundingClientRect()
            const x = b.left + b.width / 2
            const y = b.top + b.height / 2
            const surface = surfaceAt(x, y)
            const was = el.dataset.light === '1'
            let light = was
            if (surface === 'footer') light = true
            else if (surface === 'page') light = false
            else {
              const lum = lumAt(x, y)
              if (lum < DARK_BELOW) light = true
              else if (lum > LIGHT_ABOVE) light = false
            }
            if (light !== was) el.dataset.light = light ? '1' : '0'
          })
          return
        }

        // Mobile : une seule couleur pour tout l'indicateur, posé sur son petit fond crème
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        const surface = surfaceAt(x, y)
        const light = surface === 'footer' || (surface === 'shader' && r.luminanceAt(x, y) < 0.62)
        if (light !== current) {
          votes += 1
          if (votes >= 2 || current === null) {
            votes = 0
            current = light
            onProbeRef.current(light)
          }
        } else {
          votes = 0
        }
      },
    })

    return () => {
      renderer?.destroy()
      window.removeEventListener('scroll', updateClip)
      window.removeEventListener('resize', updateClip)
    }
  }, [floodRef, probeRef])

  return <canvas ref={canvasRef} className="dither-canvas" aria-hidden="true" />
}
