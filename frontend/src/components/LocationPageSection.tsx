import type { ReactNode } from 'react'

import { ScrollReveal } from './ScrollReveal'

type LocationPageSectionProps = {
  id?: string
  eyebrow?: string
  title: string
  description?: string | null
  children: ReactNode
  className?: string
}

export function LocationPageSection({
  id,
  eyebrow,
  title,
  description,
  children,
  className = '',
}: LocationPageSectionProps) {
  return (
    <section id={id} className={`scroll-mt-28 ${className}`}>
      <ScrollReveal animation="up">
        <div className="mb-6 md:mb-8">
          {eyebrow ? (
            <p className="text-eyebrow text-brand-700 dark:text-brand-300">{eyebrow}</p>
          ) : null}
          <h2
            className={`font-bold tracking-tight text-fg ${eyebrow ? 'mt-2 text-2xl md:text-3xl' : 'text-2xl md:text-3xl'}`}
          >
            <span className="bg-gradient-to-r from-fg via-fg to-brand-700 bg-clip-text dark:to-brand-300">
              {title}
            </span>
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-body-sm leading-relaxed text-fg-muted">{description}</p>
          ) : null}
        </div>
      </ScrollReveal>
      {children}
    </section>
  )
}
