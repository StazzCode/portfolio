export function TechTags({ tech }: { tech: string[] }) {
  return (
    <span className="font-mono text-sm text-gray-600">{tech.map((t) => `[${t}]`).join(' ')}</span>
  )
}
