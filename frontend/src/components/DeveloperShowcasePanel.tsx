import { Link } from 'react-router-dom'

import type { PartnerSlug } from '../content/partners'
import { AYAT_PARTNER, TEMER_PARTNER, partnerForSlug } from '../content/partners'
import { ButtonArrow, ButtonArrowExternal } from './ButtonArrow'
import { PartnerLogo } from './PartnerLogo'

const ACCENT = {
  [AYAT_PARTNER.slug]: {
    blob: 'from-red-950/8 via-transparent to-brand-500/5',
    line: 'bg-red-900/70',
    highlight: 'border-red-900/15 bg-red-50/80 text-red-950 dark:bg-red-950/30 dark:text-red-100',
  },
  [TEMER_PARTNER.slug]: {
    blob: 'from-emerald-950/8 via-transparent to-emerald-500/5',
    line: 'bg-emerald-700/70',
    highlight: 'border-emerald-800/15 bg-emerald-50/80 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100',
  },
} as const

type DeveloperShowcasePanelProps = {
  partnerSlug: PartnerSlug
  eyebrow: string
  title: string
  description: string
  highlights: string[]
  image?: string
  imageTitle?: string
  browseTo: string
  browseLabel: string
  officialHref: string
  officialLabel: string
  secondaryTo?: string
  secondaryLabel?: string
  reverse?: boolean
  index?: number
}

export function DeveloperShowcasePanel({
  partnerSlug,
  eyebrow,
  title,
  description,
  highlights,
  image,
  imageTitle,
  browseTo,
  browseLabel,
  officialHref,
  officialLabel,
  secondaryTo,
  secondaryLabel,
  reverse = false,
  index = 0,
}: DeveloperShowcasePanelProps) {
  const partner = partnerForSlug(partnerSlug)!
  const accent = ACCENT[partnerSlug]
  const isTemer = partnerSlug === TEMER_PARTNER.slug

  return (
    <article
      className="developer-showcase group relative overflow-hidden border-t border-border py-16 sm:py-20 lg:py-24"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div
        className={`pointer-events-none absolute -top-24 h-80 w-80 rounded-full bg-gradient-to-br blur-3xl ${accent.blob} ${
          reverse ? '-left-24' : '-right-24'
        }`}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[90rem] px-4 sm:px-8">
        <div
          className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20 ${
            reverse ? 'lg:[&>*:first-child]:order-2' : ''
          }`}
        >
          {/* Copy */}
          <div className="min-w-0">
            <div className={`mb-6 h-1 w-12 rounded-full ${accent.line}`} aria-hidden />

            <p className="section-eyebrow">{eyebrow}</p>

            <div className="mt-6 flex items-start gap-5 sm:gap-6">
              <div className="developer-showcase-logo shrink-0">
                <PartnerLogo
                  companySlug={partnerSlug}
                  size="lg"
                  className={`shadow-lg ring-4 ring-white dark:ring-slate-900 ${
                    isTemer ? 'h-28 w-36 object-contain sm:h-32 sm:w-40' : ''
                  }`}
                />
              </div>
              <div className="min-w-0 pt-1">
                <h2 className="text-h1 leading-tight">{partner.brandName}</h2>
              </div>
            </div>

            <p className="text-lead mt-6 max-w-xl">{description}</p>

            <ul className="mt-8 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-fg-muted">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accent.line}`}
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonArrow to={browseTo}>{browseLabel}</ButtonArrow>
              {secondaryTo && secondaryLabel ? (
                <ButtonArrow to={secondaryTo} variant="outline">
                  {secondaryLabel.replace(/:$/, '')}
                </ButtonArrow>
              ) : null}
              <ButtonArrowExternal href={officialHref} variant="outline">
                {officialLabel.replace(/ ↗$/, '')}
              </ButtonArrowExternal>
            </div>
          </div>

          {/* Visual */}
          {image ? (
            <Link
              to={browseTo}
              className="developer-showcase-visual relative block overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]"
            >
              <div className="aspect-[4/5] overflow-hidden bg-surface-muted sm:aspect-[5/6]">
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-cover transition duration-[1.2s] ease-out group-hover:scale-[1.06]"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  {partner.brandName}
                </p>
                <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  {imageTitle ?? title}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition group-hover:gap-3">
                  {browseLabel}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-950">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </span>
              </div>
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}
