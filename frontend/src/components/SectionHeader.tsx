type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
}

export function SectionHeader({ eyebrow, title, description, align = 'left' }: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left'
  return (
    <header className={`max-w-2xl ${alignClass}`}>
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2 className={`section-title ${eyebrow ? 'mt-2' : ''}`}>{title}</h2>
      {description ? (
        <p className="mt-3 text-body">{description}</p>
      ) : null}
    </header>
  )
}
