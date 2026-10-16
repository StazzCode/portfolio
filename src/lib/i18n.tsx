import { createContext, useContext, useEffect, useState } from 'react'

export type Lang = 'fr' | 'en'
/** Un texte disponible dans les deux langues */
export type Localized = Record<Lang, string>

const STORAGE_KEY = 'portfolio-lang'

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'fr' || saved === 'en') return saved
  } catch {
    /* stockage indisponible : on retombe sur la langue du navigateur */
  }
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  /** Choisit la bonne langue d'un texte localisé */
  t: (text: Localized) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* rien à faire */
    }
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t: (text) => text[lang] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n doit être utilisé dans <I18nProvider>')
  return ctx
}

/** Textes de l'interface (hors contenus des fichiers de données) */
export const ui = {
  language: { fr: 'Langue', en: 'Language' },
  downloadCv: { fr: 'Télécharger le CV', en: 'Download my resume' },
  projects: { fr: 'Projets', en: 'Projects' },
  skills: { fr: 'Compétences', en: 'Skills' },
  journey: { fr: 'Parcours', en: 'Experience' },
  footerLead: {
    fr: 'Un projet, une question, une opportunité ?',
    en: 'A project, a question, an opportunity?',
  },
  links: { fr: 'Liens', en: 'Links' },
  backToTop: { fr: 'Haut de page', en: 'Back to top' },
  setIn: { fr: 'Composé en', en: 'Set in' },
} satisfies Record<string, Localized>
