import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { AyatPriceCalculator } from '../components/AyatPriceCalculator'
import { LocationDetailSections } from '../components/LocationDetailSections'
import { api } from '../api/client'
import type { PublicLocationContent } from '../api/types'
import { useTranslation } from '../context/LocaleContext'
import { formatMoney } from '../lib/format'
import { formatShopFloorLabel } from '../lib/ayatLabels'
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

  const title = location ? shopLocationTitle(location, t) : t('pageTitles.shops')
  const contentQuery = useQuery({
    queryKey: ['public-location-content', 'shop', zoneId],
    enabled: Boolean(zoneId),
    queryFn: async () => {
      const { data } = await api.get<PublicLocationContent>(`/public/location-content/shop/${zoneId}`)
      return data
    },
  })
  usePageTitle(
    title,
    contentQuery.data?.description?.trim()?.slice(0, 160) || t('seo.shopsDescription'),
  )

  if (!zoneId || !location) {
    return (
      <div className="surface p-6 text-center">
        <p className="text-h3">{t('shops.notFoundTitle')}</p>
        <p className="mt-2 text-body-sm text-fg-muted">{t('shops.notFoundBody')}</p>
        <Link to="/shops" className="btn-primary mt-6 inline-flex">
          {t('shops.backToLocations')}
        </Link>
      </div>
    )
  }

  const floors = shopFloorKeys(location)
  const hasRateTable = floors.length > 0
  const isBoleAir = location.id === 'bole-air'

  return (
    <div className="space-y-10 text-left">
      <nav className="text-sm text-fg-muted">
        <Link to="/shops" className="font-medium text-brand-700 hover:underline dark:text-brand-300">
          {t('shops.backToLocations')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-fg">{title}</span>
      </nav>

      <header className="max-w-2xl">
        <p className="text-eyebrow text-brand-700 dark:text-brand-300">{t('shops.commercial')}</p>
        <h1 className="mt-2 text-h1">{contentQuery.data?.title || title}</h1>
        {contentQuery.data?.subtitle ? (
          <p className="mt-1 text-lg text-fg-muted">{contentQuery.data.subtitle}</p>
        ) : null}
        <p className="mt-4 text-body-sm">
          {contentQuery.data?.description || t('shops.locationDetailIntro')}
        </p>
        {isBoleAir ? (
          <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">{t('calculator.boleAirGroundOnly')}</p>
        ) : null}
      </header>

      <LocationDetailSections
        content={contentQuery.data}
        mediaTitle={t('projectBrowse.mediaTitle')}
        cardsTitle={t('projectBrowse.layoutsTitle')}
      />

      {hasRateTable ? (
        <section className="surface overflow-hidden">
          <h2 className="border-b border-border px-5 py-4 text-sm font-semibold text-fg">
            {t('shops.officialRatesTitle')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  <th className="px-5 py-3 font-semibold text-fg">{t('shops.floorColumn')}</th>
                  <th className="px-5 py-3 font-semibold text-fg">{t('shops.pricePerSqmColumn')}</th>
                </tr>
              </thead>
              <tbody>
                {floors.map((f) => (
                  <tr key={f} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-fg">{formatShopFloorLabel(f, t)}</td>
                    <td className="px-5 py-3 font-medium text-fg">
                      {formatMoney(location.floors[f], 'ETB')}
                      <span className="text-fg-muted"> / m²</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-5 py-3 text-xs text-fg-muted">{t('shops.ratesNote')}</p>
        </section>
      ) : (
        <p className="text-sm text-fg-muted">{t('shops.ratesPending')}</p>
      )}

      {hasRateTable ? (
        <section className="space-y-4">
          <h2 className="text-h3">{t('shops.estimateTitle')}</h2>
          <AyatPriceCalculator variant="page" initialKind="commercial" initialShopZoneId={location.id} />
        </section>
      ) : null}
    </div>
  )
}
