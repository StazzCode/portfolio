interface SectionTitleProps {
  index: number
  title: string
  /** Repère bleu sur le rail pour la première section */
  accent?: boolean
}

export function SectionTitle({ index, title, accent = false }: SectionTitleProps) {
  return (
    <div className="section-title">
      <span aria-hidden="true" className={`marker ${accent ? 'bg-accent' : 'bg-black'}`} />
      <h2 className="font-mono">
        <span className="section-index">{String(index).padStart(2, '0')}/</span>
        {title}
      </h2>
      <span aria-hidden="true" className="dotted" />
    </div>
  )
}
