import { Link, useSearchParams } from 'react-router-dom'

import { AyatPriceCalculator } from '../components/AyatPriceCalculator'
import type { PropertyKind } from '../data/ayatCalculatorConfig'
import { SITE_CONTACT, siteWhatsAppHref } from '../content/siteContact'
import { useTranslation } from '../context/LocaleContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { SHOW_PUBLIC_CALCULATOR } from '../lib/featureFlags'

function initialKindFromSearch(params: URLSearchParams): PropertyKind | null {
  const raw = params.get('kind') ?? params.get('type')
  if (raw === 'shop' || raw === 'commercial') return 'commercial'
  if (raw === 'apartment' || raw === 'home' || raw === 'residential') return 'residential'
  return null
}

function CalculatorPausedNotice() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-xl space-y-6 text-left">
      <section className="surface p-6 sm:p-8">
        <p className="text-eyebrow text-brand-700 dark:text-brand-300">{t('calculator.pausedEyebrow')}</p>
        <h1 className="mt-2 text-h2">{t('calculator.pausedTitle')}</h1>
        <p className="mt-3 text-body-sm leading-relaxed text-fg-muted">{t('calculator.pausedBody')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={SITE_CONTACT.telHref} className="btn-primary inline-flex">
            {t('contact.call')} · {SITE_CONTACT.phoneDisplay}
          </a>
          <a
            href={siteWhatsAppHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-muted"
          >
            {t('contact.whatsapp')}
          </a>
        </div>
        <p className="mt-6 text-sm text-fg-muted">
          <Link to="/apartments" className="font-medium text-brand-700 underline dark:text-brand-300">
            {t('calculator.pausedBrowseHomes')}
          </Link>
          <span className="mx-2 text-fg-muted/50">·</span>
          <Link to="/shops" className="font-medium text-brand-700 underline dark:text-brand-300">
            {t('calculator.pausedBrowseShops')}
          </Link>
        </p>
      </section>
    </div>
  )
}

export function AyatCalculatorPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  usePageTitle(
    SHOW_PUBLIC_CALCULATOR ? t('pageTitles.calculator') : t('pageTitles.calculatorPaused'),
    SHOW_PUBLIC_CALCULATOR ? t('seo.calculatorDescription') : t('seo.calculatorPausedDescription'),
  )

  if (!SHOW_PUBLIC_CALCULATOR) {
    return <CalculatorPausedNotice />
  }

  const kind = initialKindFromSearch(searchParams)
  const zone = searchParams.get('zone') ?? searchParams.get('shop_zone')
  return (
    <AyatPriceCalculator
      variant="page"
      initialKind={kind}
      initialShopZoneId={kind === 'commercial' ? zone : null}
    />
  )
}
