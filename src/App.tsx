import './index.css'
import { useEffect, useRef } from 'react'
import { DitherBackground } from './components/DitherBackground'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Journey } from './components/Journey'
import { Projects } from './components/Projects'
import { ScrollGauge } from './components/ScrollGauge'
import { Skills } from './components/Skills'
import { useScrollMetrics } from './hooks/useScrollMetrics'
import { startDitherFavicon } from './lib/favicon'
import { I18nProvider } from './lib/i18n'

export function App() {
  const footerRef = useRef<HTMLElement>(null)
  const gaugeRef = useRef<HTMLDivElement>(null)
  const { progress, reveal, floodRef } = useScrollMetrics(footerRef)

  // Icône d'onglet : sphère tramée animée
  useEffect(() => startDitherFavicon(), [])

  return (
    <I18nProvider>
      <div id="top" className="page">
        <DitherBackground floodRef={floodRef} probeRef={gaugeRef} />
        <ScrollGauge ref={gaugeRef} progress={progress} />

        {/* Colonne centrale, posée sur le shader */}
        <div className="sheet">
          <div aria-hidden="true" className="rail left-0" />
          <div aria-hidden="true" className="rail right-0" />
          <Header />
          <Hero />
          <main className="main-body">
            <Projects />
            <Skills />
            <Journey />
          </main>
        </div>

        <Footer ref={footerRef} reveal={reveal} />
      </div>
    </I18nProvider>
  )
}

export default App
