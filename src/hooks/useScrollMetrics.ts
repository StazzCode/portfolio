import { useEffect, useRef, useState, type RefObject } from 'react'

export interface ScrollMetrics {
  /** Progression du scroll sur toute la page (0–1) */
  progress: number
  /** Arrivée du footer : 0 quand il entre à l'écran, 1 quand il le remplit */
  reveal: number
  /** Remplissage bleu du fond juste avant le footer (0–1), lu par le shader à chaque image */
  floodRef: RefObject<number>
}

export function useScrollMetrics(footerRef: RefObject<HTMLElement | null>): ScrollMetrics {
  const [progress, setProgress] = useState(0)
  const [reveal, setReveal] = useState(0)
  const floodRef = useRef(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      setProgress((prev) => (Math.abs(prev - p) > 0.004 ? p : prev))

      const foot = footerRef.current
      if (foot) {
        const top = foot.getBoundingClientRect().top
        const h = window.innerHeight
        const r = Math.min(1, Math.max(0, (h - top) / (h * 0.75)))
        setReveal((prev) => (Math.abs(prev - r) > 0.01 || (r === 0) !== (prev === 0) ? r : prev))
        floodRef.current = Math.min(1, Math.max(0, (h * 1.4 - top) / (h * 0.9)))
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [footerRef])

  return { progress, reveal, floodRef }
}
