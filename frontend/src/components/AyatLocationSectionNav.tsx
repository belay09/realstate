import { ScrollReveal } from './ScrollReveal'

type Section = {
  id: string
  label: string
}

type AyatLocationSectionNavProps = {
  sections: Section[]
}

export function AyatLocationSectionNav({ sections }: AyatLocationSectionNavProps) {
  if (sections.length === 0) return null

  return (
    <ScrollReveal animation="fade" delayMs={200}>
      <nav
        aria-label="Page sections"
        className="sticky top-[4.5rem] z-20 flex flex-wrap gap-1 border-b border-border bg-canvas/95 pb-0 backdrop-blur-md"
      >
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="-mb-px border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-fg-muted transition hover:border-brand-300 hover:text-brand-800 dark:hover:text-brand-200"
          >
            {s.label}
          </a>
        ))}
      </nav>
    </ScrollReveal>
  )
}
