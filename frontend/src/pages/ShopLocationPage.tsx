import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { AyatPriceCalculator } from '../components/AyatPriceCalculator'
import { FloorRateTable } from '../components/FloorRateTable'
import { LocationDetailSections } from '../components/LocationDetailSections'
import { SiteContactBanner } from '../components/SiteContactStrip'
import { api } from '../api/client'
import type { PublicLocationContent } from '../api/types'
import { AYAT_PARTNER, partnerForSlug } from '../content/partners'
import { useTranslation } from '../context/LocaleContext'
import { formatShopFloorLabel } from '../lib/ayatLabels'
import { SHOW_PUBLIC_CALCULATOR } from '../lib/featureFlags'
import { developerShopsPath } from '../lib/developerRoutes'
import { usePageTitle } from '../hooks/usePageTitle'
import { useCalculatorConfig } from '../hooks/useCalculatorConfig'
import { useLocationBrowseSummaries } from '../hooks/useLocationBrowseSummaries'
import { useLocationVisibility } from '../hooks/useLocationVisibility'
import { mergeShopBrowseLocations } from '../lib/mergeShopBrowseLocations'
import {
  getShopLocationById,
  shopFloorKeys,
  shopLocationTitle,
  shopLocationsFromConfig,
} from '../lib/shopLocations'

export function ShopLocationPage() {
  const { t } = useTranslation()
  const { zoneId } = useParams<{ zoneId: string }>()
  const [searchParams] = useSearchParams()
  const { data: config } = useCalculatorConfig()
  const { data: visibility } = useLocationVisibility()
  const summariesQuery = useLocationBrowseSummaries('shop')
  const shopLocations = React.useMemo(
    () =>
      mergeShopBrowseLocations(
        shopLocationsFromConfig(config),
        summariesQuery.data,
        visibility,
      ),
    [config, summariesQuery.data, visibility],
  )
  const location = zoneId ? getShopLocationById(zoneId, shopLocations) : undefined
  const cmsSummary = zoneId ? summariesQuery.data?.get(zoneId) : undefined
  const companySlug =
    cmsSummary?.company_slug ||
    searchParams.get('company_slug') ||
    AYAT_PARTNER.slug
  const partner = partnerForSlug(companySlug)
  const shopsBackTo = partner ? developerShopsPath(partner.slug) : '/shops'

  const title = location ? shopLocationTitle(location, t) : t('pageTitles.shops')
  const contentQuery = useQuery({
    queryKey: ['public-location-content', 'shop', zoneId],
    enabled: Boolean(zoneId),
    queryFn: async () => {
      const { data } = await api.get<PublicLocationContent>(`/public/location-content/shop/${zoneId}`)
      return data
    },
  })
  const content = contentQuery.data
  usePageTitle(
    title,
    content?.description?.trim()?.slice(0, 160) || t('seo.shopsDescription'),
  )

  if (!zoneId || !location) {
    return (
      <div className="surface p-6 text-center">
        <p className="text-h3">{t('shops.notFoundTitle')}</p>
        <p className="mt-2 text-body-sm text-fg-muted">{t('shops.notFoundBody')}</p>
        <Link to={shopsBackTo} className="btn-primary mt-6 inline-flex">
          {t('shops.backToLocations')}
        </Link>
      </div>
    )
  }

  const floors = shopFloorKeys(location)
  const hasRateTable = floors.length > 0
  const isBoleAir = location.id === 'bole-air'
  const displayTitle = content?.title || title
  const primaryImage =
    content?.media?.find((m) => m.is_primary && m.media_type === 'image')?.url ??
    content?.media?.find((m) => m.media_type === 'image')?.url ??
    location.coverImageUrl ??
    cmsSummary?.cover_image_url ??
    null
  const contactPrefill = t('shops.whatsappPrefill', { location: displayTitle })

  return (
    <div className="space-y-10 pb-8 text-left md:space-y-12">
      <nav className="text-sm text-fg-muted">
        <Link
          to={shopsBackTo}
          className="font-medium text-brand-700 hover:underline dark:text-brand-300"
        >
          ← {t('shops.backToLocations')}
        </Link>
      </nav>

      {primaryImage ? (
        <div className="overflow-hidden rounded-[1.5rem] border border-border shadow-[0_24px_56px_-28px_rgba(15,23,42,0.22)]">
          <img src={primaryImage} alt="" className="aspect-[21/9] w-full object-cover sm:aspect-[2.4/1]" />
        </div>
      ) : null}

      <header className="max-w-2xl">
        <p className="text-eyebrow">
          {partner
            ? t('shops.developerBadge', { developer: partner.brandName })
            : t('shops.commercial')}
        </p>
        <h1 className="mt-3 text-h1">{displayTitle}</h1>
        {content?.subtitle ? (
          <p className="mt-3 text-lg font-medium text-fg-muted">{content.subtitle}</p>
        ) : null}
        <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-fg-muted">
          {content?.description || t('shops.locationDetailIntro')}
        </p>
        {isBoleAir ? (
          <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">
            {t('calculator.boleAirGroundOnly')}
          </p>
        ) : null}
      </header>

      <LocationDetailSections
        content={content}
        mediaTitle={t('projectBrowse.mediaTitle')}
        cardsTitle={t('projectBrowse.layoutsTitle')}
      />

      {hasRateTable ? (
        <FloorRateTable
          id="shop-rates"
          title={t('shops.officialRatesTitle')}
          floorColumnLabel={t('shops.floorColumn')}
          priceColumnLabel={t('shops.pricePerSqmColumn')}
          note={t('shops.ratesNote')}
          rows={floors.map((f) => ({
            key: f,
            floorLabel: formatShopFloorLabel(f, t),
            pricePerSqm: location.floors[f],
          }))}
        />
      ) : (
        <p id="shop-rates" className="scroll-mt-28 rounded-2xl border border-border bg-surface-muted px-5 py-4 text-sm text-fg-muted">
          {t('shops.ratesPending')}
        </p>
      )}

      {SHOW_PUBLIC_CALCULATOR && hasRateTable ? (
        <section className="space-y-4">
          <h2 className="text-h3">{t('shops.estimateTitle')}</h2>
          <AyatPriceCalculator variant="page" initialKind="commercial" initialShopZoneId={location.id} />
        </section>
      ) : null}

      <div id="shop-contact" className="scroll-mt-28">
        <SiteContactBanner whatsAppMessage={contactPrefill} hint={t('shops.contactHint')} />
      </div>
    </div>
  )
}
