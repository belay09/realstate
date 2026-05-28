import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { AyatPriceCalculator } from '../components/AyatPriceCalculator'
import { api } from '../api/client'
import type { PublicLocationContent } from '../api/types'
import { useTranslation } from '../context/LocaleContext'
import { formatMoney } from '../lib/format'
import { formatShopFloorLabel } from '../lib/ayatLabels'
import { usePageTitle } from '../hooks/usePageTitle'
import { useCalculatorConfig } from '../hooks/useCalculatorConfig'
import { getShopLocationById, shopFloorKeys, shopLocationsFromConfig } from '../lib/shopLocations'

export function ShopLocationPage() {
  const { t } = useTranslation()
  const { zoneId } = useParams<{ zoneId: string }>()
  const { data: config } = useCalculatorConfig()
  const shopLocations = shopLocationsFromConfig(config)
  const location = zoneId ? getShopLocationById(zoneId, shopLocations) : undefined

  const title = location
    ? t(location.labelKey as Parameters<typeof t>[0])
    : t('pageTitles.shops')
  const contentQuery = useQuery({
    queryKey: ['public-location-content', 'shop', zoneId],
    enabled: Boolean(zoneId),
    queryFn: async () => {
      const { data } = await api.get<PublicLocationContent>(`/public/location-content/shop/${zoneId}`)
      return data
    },
  })
  usePageTitle(title)

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

      {(contentQuery.data?.video_url || (contentQuery.data?.media?.length ?? 0) > 0) && (
        <section className="space-y-4">
          <h2 className="text-h3">Location media</h2>
          {contentQuery.data?.video_url ? (
            <div className="aspect-video overflow-hidden rounded-2xl border border-border">
              <iframe
                src={contentQuery.data.video_url}
                className="h-full w-full"
                title="Shop location video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
          {contentQuery.data?.media?.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contentQuery.data.media.map((m) => (
                <li key={m.id} className="surface overflow-hidden p-0">
                  {m.media_type === 'video' ? (
                    <video src={m.url} controls className="aspect-video w-full bg-black" />
                  ) : (
                    <img src={m.url} alt={m.caption ?? ''} className="aspect-video w-full object-cover" />
                  )}
                  {m.caption ? <p className="px-3 py-2 text-xs text-fg-muted">{m.caption}</p> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )}

      {(contentQuery.data?.cards?.length ?? 0) > 0 && (
        <section className="space-y-4">
          <h2 className="text-h3">Highlights</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contentQuery.data?.cards.map((card, idx) => (
              <li key={`${card.title}-${idx}`} className="surface p-0 overflow-hidden">
                {card.image_url ? (
                  <img src={card.image_url} alt="" className="h-36 w-full object-cover" />
                ) : null}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-fg">{card.title}</h3>
                  {card.body ? <p className="mt-2 text-sm text-fg-muted">{card.body}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      <section className="space-y-4">
        <h2 className="text-h3">{t('shops.estimateTitle')}</h2>
        <AyatPriceCalculator variant="page" initialKind="commercial" initialShopZoneId={location.id} />
      </section>
    </div>
  )
}
