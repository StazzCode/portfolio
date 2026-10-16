interface ItemLinkProps {
  title: string
  url?: string
}

export function ItemLink({ title, url }: ItemLinkProps) {
  if (!url) return <span className="item-name">{title}</span>
  return (
    <a className="item-link item-name" href={url} target="_blank" rel="noopener noreferrer">
      <span className="item-title">{title}</span>
      <span className="font-mono" aria-hidden="true">
        ↗
      </span>
    </a>
  )
}
