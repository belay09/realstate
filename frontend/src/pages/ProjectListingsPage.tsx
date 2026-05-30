import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { api } from '../api/client'
import type { Paginated, PublicListingSummary, PublicLocationContent } from '../api/types'
import { AyatPriceCalculator } from '../components/AyatPriceCalculator'
import { TemerListingCard } from '../components/TemerListingCard'
import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatListingCardTitle, resolveDevelopmentZone } from '../lib/listingDisplay'

export function ProjectListingsPage() {
  const { t } = useTranslation()
  const { projectSlug } = useParams<{ projectSlug: string }>()

  const listingsQuery = useQuery({
    queryKey: ['public-listings-project', projectSlug],
    enabled: Boolean(projectSlug),
    queryFn: async () => {
      const { data } = await api.get<Paginated<PublicListingSummary>>('/public/listings', {
        params: { project_slug: projectSlug!, limit: '100' },
      })
      return data
    },
  })

  const contentQuery = useQuery({
    queryKey: ['public-location-content', 'apartment', projectSlug],
    enabled: Boolean(projectSlug),
    queryFn: async () => {
      const { data } = await api.get<PublicLocationContent>(
        `/public/location-content/apartment/${projectSlug}`,
      )
      return data
    },
  })

  const firstListing = listingsQuery.data?.items[0]
  const companyName = firstListing?.company_name ?? 'Developer'
  const companySlug = firstListing?.company_slug
  const isAyat = companySlug === AYAT_PARTNER.slug
  const isTemer = companySlug === TEMER_PARTNER.slug

  const zone = projectSlug ? resolveDevelopmentZone(projectSlug, firstListing?.area ?? null) : ''
  const pageTitle =
    contentQuery.data?.title || firstListing?.project_name || zone || t('pageTitles.apartments')
  usePageTitle(pageTitle)

  const backTo = '/apartments'

  if (!projectSlug) {
    return <p className="text-sm text-red-600">{t('projectBrowse.missingProject')}</p>
  }

  if (listingsQuery.isLoading && contentQuery.isLoading) {
    return <p className="text-body-sm">{t('projectBrowse.loading')}</p>
  }

  if (listingsQuery.isSuccess && (listingsQuery.data?.items.length ?? 0) === 0) {
    return (
      <div className="surface p-6 text-center">
        <p className="text-h3">{t('projectBrowse.notFoundTitle')}</p>
        <p className="mt-2 text-body-sm text-fg-muted">{t('projectBrowse.notFoundBody')}</p>
        <Link to="/apartments" className="btn-primary mt-6 inline-flex">
          {t('projectBrowse.backToLocations')}
        </Link>
      </div>
    )
  }

  const content = contentQuery.data

  return (
    <div className="space-y-10 text-left">
      <nav className="text-sm text-fg-muted">
        <Link to={backTo} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
          {t('projectBrowse.backToLocations')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-fg">{content?.title || firstListing?.project_name || zone || projectSlug}</span>
      </nav>

      <header className="max-w-2xl">
        <p className="text-eyebrow text-brand-700 dark:text-brand-300">
          {t('projectBrowse.developerApartments', { developer: companyName })}
        </p>
        <h1 className="mt-2 text-h1">{content?.title || firstListing?.project_name || zone || projectSlug}</h1>
        {content?.subtitle ? <p className="mt-1 text-lg text-fg-muted">{content.subtitle}</p> : null}
        <p className="mt-4 text-body-sm">
          {content?.description || t('projectBrowse.chooseLayout')}
        </p>
      </header>

      {(content?.video_url || (content?.media?.length ?? 0) > 0) && (
        <section className="space-y-4">
          <h2 className="text-h3">Location media</h2>
          {content?.video_url ? (
            <div className="aspect-video overflow-hidden rounded-2xl border border-border">
              <iframe
                src={content.video_url}
                className="h-full w-full"
                title="Location video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
          {content?.media?.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.media.map((m) => (
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

      {(listingsQuery.data?.items.length ?? 0) > 0 && (
        <section className="space-y-4">
          <h2 className="text-h3">{t('projectBrowse.homesHere')}</h2>
          {isTemer ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listingsQuery.data!.items.map((item) => (
                <li key={item.slug}>
                  <TemerListingCard listing={item} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {listingsQuery.data!.items.map((item) => (
                <li key={item.slug}>
                  <Link
                    to={`/listings/${item.slug}`}
                    className="surface block p-5 transition hover:border-brand-300"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                      {item.company_name}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-fg">{formatListingCardTitle(item, t)}</h3>
                    <p className="mt-2 text-body-sm text-fg-muted">
                      {item.bedrooms != null
                        ? t('projectBrowse.bedroomCount', { count: item.bedrooms })
                        : null}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {isAyat ? (
        <section className="space-y-4">
          <h2 className="text-h3">{t('projectBrowse.priceEstimate')}</h2>
          <AyatPriceCalculator variant="page" initialKind="residential" />
        </section>
      ) : isTemer ? (
        <section className="surface-muted space-y-3 p-6">
          <p className="section-eyebrow">{t('temer.priceOnRequestTitle')}</p>
          <p className="text-body-sm">{t('temer.priceOnRequestBody')}</p>
          <a
            href="https://temerproperties.com/price-calculator/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-semibold text-brand-700 underline dark:text-brand-300"
          >
            {t('temer.temerCalculatorLink')}
          </a>
        </section>
      ) : null}
    </div>
  )
}
