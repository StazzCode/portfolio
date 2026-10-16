import { forwardRef } from 'react'
import links from '../data/links.json'
import { useParisTime } from '../hooks/useParisTime'
import { ui, useI18n } from '../lib/i18n'
import { GitHubIcon, LinkedInIcon } from './Icons'

const COLUMN = 672

/** Remonte en douceur (instantané si l'utilisateur a réduit les animations) */
function scrollToTop(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault()
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
}

interface FooterProps {
  /** 0 → aussi large que la colonne, 1 → bord à bord */
  reveal: number
}

export const Footer = forwardRef<HTMLElement, FooterProps>(function Footer({ reveal }, ref) {
  const { t } = useI18n()
  const time = useParisTime()
  const width = typeof window !== 'undefined' ? window.innerWidth : 1440
  // Mobile : pleine largeur d'emblée (sinon le fond clair apparaît sur les côtés)
  const start = width <= 640 ? 0 : Math.max(0, (width - COLUMN) / 2)
  const inset = Math.round(start * (1 - reveal))

  return (
    <footer ref={ref} data-footer className="big-footer" style={{ marginInline: inset }}>
      <div className="bf-inner">
        <div className="bf-top font-mono">
          <span>~/portfolio</span>
          <span>EOF</span>
        </div>

        <div className="flex flex-col gap-7">
          <p className="bf-lead font-mono">{t(ui.footerLead)}</p>
          <a className="bf-mail font-mono" href={`mailto:${links.email}`}>
            {links.email} <span aria-hidden="true">↗</span>
          </a>
          <nav className="bf-links font-mono" aria-label={t(ui.links)}>
            <a href={links.linkedin} target="_blank" rel="noopener noreferrer">
              <LinkedInIcon />
              LinkedIn ↗
            </a>
            <a href={links.github} target="_blank" rel="noopener noreferrer">
              <GitHubIcon />
              GitHub ↗
            </a>
            <a href="#top" onClick={scrollToTop}>
              {t(ui.backToTop)} ↑
            </a>
          </nav>
        </div>

        <div className="bf-meta font-mono">
          <span>(c) {new Date().getFullYear()} Kellian Mirey</span>
          <span>Lille · {time}</span>
          <span>
            {t(ui.setIn)}{' '}
            <a className="bf-font" href={links.font} target="_blank" rel="noopener noreferrer">
              Departure Mono ↗
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
})
