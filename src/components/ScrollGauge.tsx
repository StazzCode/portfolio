import { forwardRef } from 'react'

const CELLS = 24

interface ScrollGaugeProps {
  progress: number
  /** Mobile : fond bleu dessous, on passe tout l'indicateur en blanc */
  light: boolean
}

/**
 * Indicateur de scroll : vertical à droite sur grand écran, horizontal en bas sur mobile.
 * Sur grand écran, chaque élément marqué `data-ink` reçoit `data-light` selon le pixel
 * du shader situé juste dessous (voir DitherBackground).
 */
export const ScrollGauge = forwardRef<HTMLDivElement, ScrollGaugeProps>(function ScrollGauge(
  { progress, light },
  ref
) {
  const filled = Math.round(progress * CELLS)
  return (
    <div ref={ref} className={`gauge font-mono ${light ? 'is-light' : ''}`} aria-hidden="true">
      <span className="gauge-label" data-ink>
        {String(Math.round(progress * 100)).padStart(3, '0')}%
      </span>
      <div className="gauge-track">
        {Array.from({ length: CELLS }, (_, i) => (
          <span key={i} data-ink className={`gauge-cell ${i < filled ? 'is-filled' : ''}`} />
        ))}
      </div>
    </div>
  )
})
