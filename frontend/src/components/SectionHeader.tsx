type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  large?: boolean
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  large = false,
}: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left'
  const titleClass = large
    ? 'text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-slate-50'
    : 'section-title'

  return (
    <header className={`max-w-3xl ${alignClass}`}>
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2 className={`${titleClass} ${eyebrow ? 'mt-3' : ''}`}>{title}</h2>
      {description ? <p className="text-lead mt-4 max-w-2xl">{description}</p> : null}
    </header>
  )
}
