import { Link } from 'react-router-dom'

import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER } from '../content/partners'

type PartnerAyatSectionProps = {
  compact?: boolean
}

export function PartnerAyatSection({ compact = false }: PartnerAyatSectionProps) {
  const { t, messages } = useTranslation()

  return (
    <section
      className={`surface-muted relative overflow-hidden ${
        compact ? 'p-6 sm:p-8' : 'p-8 sm:p-10 lg:p-12'
      }`}
    >
      <div
        className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-brand-400/15 blur-3xl"
        aria-hidden
      />
      <div className={`relative flex flex-col gap-8 ${compact ? '' : 'lg:flex-row lg:items-center'}`}>
        <div className="flex shrink-0 flex-col items-center">
          <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-surface bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg sm:h-32 sm:w-32">
            <span className="text-4xl font-bold leading-none">
              {AYAT_PARTNER.yearsEstablished.replace('+', '')}
            </span>
            <span className="mt-1 text-[0.65rem] font-semibold uppercase tracking-widest text-brand-100">
              {t('ayat.years')}
            </span>
          </div>
          <p className="mt-3 text-center text-xs font-semibold text-brand-700 dark:text-brand-300">
            {AYAT_PARTNER.brandName}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="section-eyebrow">{t('ayat.featuredEyebrow')}</p>
          <h2 className={`mt-2 text-h2 ${compact ? 'text-xl sm:text-2xl' : ''}`}>{AYAT_PARTNER.brandName}</h2>
          <p className="mt-4 text-body-sm sm:text-base">
            {t('ayat.body', { reputation: t('ayat.reputation') })}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {messages.ayat.highlights.map((item) => (
              <li
                key={item}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-fg"
              >
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/apartments" className="btn-primary">
              {t('ayat.browseAyat')}
            </Link>
            <a
              href={AYAT_PARTNER.website}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              {t('ayat.officialSite')}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
