import links from '../data/links.json'
import { useParisTime } from '../hooks/useParisTime'
import { ui, useI18n, type Lang } from '../lib/i18n'
import { DownloadIcon } from './Icons'

const LANGS: Lang[] = ['fr', 'en']

export function Header() {
  const time = useParisTime()
  const { lang, setLang, t } = useI18n()

  return (
    <header className="site-header font-mono">
      <span className="tabular-nums">
        LIL <span className="text-black">{time}</span>
      </span>
      <div className="flex items-center gap-3">
        <div className="lang" role="group" aria-label={t(ui.language)}>
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              className="lang-btn"
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
            >
              {l}
            </button>
          ))}
        </div>
        <a className="cv-btn" href={links.cv} download aria-label={t(ui.downloadCv)}>
          <DownloadIcon />
          <span>CV</span>
        </a>
      </div>
    </header>
  )
}
