import projects from '../data/projects.json'
import { ui, useI18n } from '../lib/i18n'
import { ItemLink } from './ItemLink'
import { SectionTitle } from './SectionTitle'
import { TechTags } from './TechTag'

export function Projects() {
  const { t } = useI18n()
  return (
    <section id="projets" className="section">
      <SectionTitle index={1} title={t(ui.projects)} accent />
      <ol className="entries projects-list">
        {projects.map((project) => (
          <li key={project.link} className="entry">
            <span className="entry-year font-mono">{project.year}</span>
            <div className="entry-body">
              <ItemLink title={t(project.name)} url={project.link} />
              <p className="entry-text">{t(project.description)}</p>
              <TechTags tech={project.tech} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
