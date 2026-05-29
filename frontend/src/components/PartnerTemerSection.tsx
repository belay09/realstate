import { Link } from 'react-router-dom'

import { useTranslation } from '../context/LocaleContext'
import { TEMER_PARTNER } from '../content/partners'
import { PartnerLogo } from './PartnerLogo'

type PartnerTemerSectionProps = {
  compact?: boolean
}

export function PartnerTemerSection({ compact = false }: PartnerTemerSectionProps) {
  const { t, messages } = useTranslation()

  return (
    <section
      className={`surface-luxury relative overflow-hidden ${compact ? 'h-full p-6 sm:p-8' : 'p-8 sm:p-10 lg:p-12'}`}
    >
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden
      />
      <div className={`relative flex flex-col gap-8 ${compact ? '' : 'lg:flex-row lg:items-center'}`}>
        <div className="flex shrink-0 flex-col items-center">
          <PartnerLogo companySlug={TEMER_PARTNER.slug} size="lg" />
          <p className="mt-3 text-center text-xs font-semibold text-brand-700 dark:text-brand-300">
            {TEMER_PARTNER.brandName}
          </p>
          <p className="text-center text-xs text-fg-muted">
            {t('temer.hotline', { hotline: TEMER_PARTNER.hotline })}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="section-eyebrow">{t('temer.featuredEyebrow')}</p>
          <h2 className={`mt-2 text-h2 ${compact ? 'text-xl sm:text-2xl' : ''}`}>
            {TEMER_PARTNER.brandName}
          </h2>
          <p className="mt-4 text-body-sm sm:text-base">{t('temer.body')}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {messages.temer.highlights.map((item) => (
              <li
                key={item}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-fg"
              >
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/apartments?company_slug=${TEMER_PARTNER.slug}`}
              className="btn-primary"
            >
              {t('temer.browseTemer')}
            </Link>
            <a
              href={TEMER_PARTNER.website}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              {t('temer.officialSite')}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
