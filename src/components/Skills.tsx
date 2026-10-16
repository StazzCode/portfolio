import { skillGroups, skills } from '../data/skills'
import { ui, useI18n } from '../lib/i18n'
import { SectionTitle } from './SectionTitle'

export function Skills() {
  const { t } = useI18n()
  return (
    <section id="competences" className="section">
      <SectionTitle index={2} title={t(ui.skills)} />

      {/* Grand écran : tuiles */}
      <ul className="skill-tiles">
        {skills.map((skill, i) => (
          <li key={skill.name} className="tile">
            <div className="tile-meta font-mono">
              <span>{String(i + 1).padStart(2, '0')}</span>
              <span>{skill.group}</span>
            </div>
            <img src={skill.icon} alt="" className="h-8 w-8 object-contain" />
            <span className="font-mono text-base text-gray-900">{skill.name}</span>
          </li>
        ))}
      </ul>

      {/* Mobile : une ligne par domaine */}
      <div className="skill-groups">
        {skillGroups.map((group) => (
          <div key={group} className="sg-row">
            <span className="sg-label font-mono">{group}</span>
            <div className="sg-items">
              {skills
                .filter((s) => s.group === group)
                .map((s) => (
                  <span key={s.name} className="sg-item font-mono">
                    <img src={s.icon} alt="" />
                    {s.name}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
