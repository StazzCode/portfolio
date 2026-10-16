import { useEffect, useRef, type RefObject } from 'react'
import { createDither } from '../lib/dither'

interface DitherBackgroundProps {
  floodRef: RefObject<number>
  /** Élément dont on veut adapter la couleur au fond (l'indicateur de scroll) */
  probeRef: RefObject<HTMLElement | null>
}

const MOBILE_MAX = 640
/** On relit les pixels toutes les 3 images pour suivre le shader de près */
const SAMPLE_EVERY = 3
/** Seuils avec une petite marge, pour ne pas clignoter sur la trame */
const DARK_BELOW = 0.58
const LIGHT_ABOVE = 0.66

export function DitherBackground({ floodRef, probeRef }: DitherBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let tick = 0

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
        // Hauteur du canvas (100lvh), qui peut dépasser la fenêtre visible
        const h = canvas.clientHeight || window.innerHeight
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
        tick = (tick + 1) % SAMPLE_EVERY
        if (tick !== 0) return
        const probe = probeRef.current
        if (!probe) return
        const rect = probe.getBoundingClientRect()
        if (!rect.width) return

        // Mobile : petit fond crème seulement quand l'indicateur passe sur le texte de la
        // page ; transparent sur le shader et sur le footer
        const surfaceBelow = surfaceAt(rect.left + rect.width / 2, rect.top + rect.height / 2)
        if (probe.dataset.surface !== surfaceBelow) probe.dataset.surface = surfaceBelow

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
