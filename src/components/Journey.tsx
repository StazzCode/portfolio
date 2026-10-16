import journey from '../data/journey.json'
import { ui, useI18n } from '../lib/i18n'
import { ItemLink } from './ItemLink'
import { SectionTitle } from './SectionTitle'
import { TechTags } from './TechTag'

export function Journey() {
  const { t } = useI18n()
  return (
    <section id="parcours" className="section">
      <SectionTitle index={3} title={t(ui.journey)} />
      <ol className="entries timeline">
        {journey.map((item) => (
          <li key={item.company} className="entry">
            <span className="entry-year font-mono">{t(item.year)}</span>
            <div className="entry-body">
              <ItemLink title={item.company} url={item.url} />
              <span className="text-accent font-mono text-sm">{t(item.role)}</span>
              <span className="entry-text">{t(item.description)}</span>
              <TechTags tech={item.tech} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
