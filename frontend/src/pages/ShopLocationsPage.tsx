import * as React from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { ProductKindSwitcher } from '../components/ProductKindSwitcher'
import { ShopLocationCard } from '../components/ShopLocationCard'
import { AYAT_PARTNER, TEMER_PARTNER, partnerForSlug } from '../content/partners'
import { SITE_CONTACT, siteWhatsAppHref } from '../content/siteContact'
import { useTranslation } from '../context/LocaleContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { useCalculatorConfig } from '../hooks/useCalculatorConfig'
import { useLocationBrowseSummaries } from '../hooks/useLocationBrowseSummaries'
import { useLocationVisibility } from '../hooks/useLocationVisibility'
import { developerResidentialPath } from '../lib/developerRoutes'
import { mergeShopBrowseLocations } from '../lib/mergeShopBrowseLocations'
import { shopLocationsFromConfig } from '../lib/shopLocations'

type DeveloperFilter = '' | typeof AYAT_PARTNER.slug | typeof TEMER_PARTNER.slug

export function ShopLocationsPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const companySlug = (searchParams.get('company_slug') || '') as DeveloperFilter
  const partner = partnerForSlug(companySlug)

  usePageTitle(
    partner
      ? t('pageTitles.developerShops', { brand: partner.brandName })
      : t('pageTitles.shops'),
    partner
      ? t('seo.developerShopsDescription', { brand: partner.brandName })
      : t('seo.shopsDescription'),
  )

  const { data: config } = useCalculatorConfig()
  const { data: visibility } = useLocationVisibility()
  const summariesQuery = useLocationBrowseSummaries('shop')
  const locations = React.useMemo(
    () =>
      mergeShopBrowseLocations(
        shopLocationsFromConfig(config),
        summariesQuery.data,
        visibility,
        companySlug,
      ),
    [config, summariesQuery.data, visibility, companySlug],
  )

  const title = partner?.brandName ?? t('shops.heroTitle')
  const subtitle = partner ? t('shops.heroBodyFiltered', { brand: partner.brandName }) : t('shops.heroBody')

  return (
    <div className="space-y-10 text-left md:space-y-12">
      <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-xl">
          {partner ? <p className="text-eyebrow">{t('developer.kindShops')}</p> : null}
          <h1 className={`text-h1 ${partner ? 'mt-3' : ''}`}>{title}</h1>
          <p className="mt-3 text-body-sm text-fg-muted">{subtitle}</p>
        </div>
        {companySlug ? (
          <ProductKindSwitcher companySlug={companySlug} active="shops" className="w-full shrink-0 sm:w-auto" />
        ) : null}
      </header>

      {summariesQuery.isLoading ? (
        <p className="text-body-sm text-fg-muted">{t('shops.loading')}</p>
      ) : locations.length === 0 ? (
        <div className="surface flex flex-col items-center px-6 py-16 text-center">
          <p className="text-h2">
            {partner ? t('shops.emptyTitleFiltered', { brand: partner.brandName }) : t('shops.noLocations')}
          </p>
          <p className="mt-3 max-w-md text-body-sm text-fg-muted">
            {partner ? t('shops.emptyBodyFiltered', { brand: partner.brandName }) : null}
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
            <a href={SITE_CONTACT.telHref} className="btn-primary w-full justify-center sm:w-auto">
              {t('contact.call')}
            </a>
            <a
              href={siteWhatsAppHref(
                partner
                  ? t('developer.whatsappPrefill', { brand: partner.brandName })
                  : undefined,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full justify-center sm:w-auto"
            >
              {t('contact.whatsapp')}
            </a>
            {companySlug ? (
              <Link to={developerResidentialPath(companySlug)} className="btn-secondary w-full justify-center sm:w-auto">
                {t('developer.browseResidential')}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {locations.length > 0 ? (
        <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <li key={loc.id} className="animate-fade-in">
              <ShopLocationCard location={loc} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
