import hero from '../data/hero.json'
import { useI18n } from '../lib/i18n'
import { PinIcon } from './Icons'

export function Hero() {
  const { t } = useI18n()
  const words = t(hero.tagline).split(' ')
  const last = words.pop()

  return (
    <div className="hero-wrap">
      <section className="hero-card">
        <span className="font-mono text-xs tracking-[0.12em] text-gray-500 uppercase">
          ~/portfolio
        </span>
        <h1 className="hero-title font-mono">{hero.name}</h1>
        <p className="hero-tagline font-mono">
          <span className="text-accent">&gt;</span> {words.join(' ')}{' '}
          <span className="whitespace-nowrap">{last}</span>
        </p>
        <div className="flex items-center gap-1.5 font-mono text-sm text-gray-500">
          <PinIcon />
          <span>{hero.location}</span>
        </div>
        <p className="hero-intro">{t(hero.intro)}</p>
      </section>
    </div>
  )
}
