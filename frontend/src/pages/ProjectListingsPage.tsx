import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { api } from '../api/client'
import type { Paginated, PublicListingSummary, PublicLocationContent } from '../api/types'
import { AyatPriceCalculator } from '../components/AyatPriceCalculator'
import { LocationDetailSections } from '../components/LocationDetailSections'
import { SiteContactStrip } from '../components/SiteContactStrip'
import { TemerListingCard } from '../components/TemerListingCard'
import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import { usePageTitle } from '../hooks/usePageTitle'
import { useLocationVisibility } from '../hooks/useLocationVisibility'
import { resolveDevelopmentZone } from '../lib/listingDisplay'

export function ProjectListingsPage() {
  const { t } = useTranslation()
  const { projectSlug } = useParams<{ projectSlug: string }>()
  const { data: visibility } = useLocationVisibility()

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

  const content = contentQuery.data
  const listings = listingsQuery.data?.items ?? []
  const firstListing = listings[0]
  const companyName = firstListing?.company_name ?? 'Developer'
  const companySlug = firstListing?.company_slug
  const isAyat = companySlug === AYAT_PARTNER.slug
  const isTemer = companySlug === TEMER_PARTNER.slug

  const zone = projectSlug ? resolveDevelopmentZone(projectSlug, firstListing?.area ?? null) : ''
  const pageTitle = content?.title || firstListing?.project_name || zone || t('pageTitles.apartments')
  usePageTitle(pageTitle)

  const backTo = isTemer ? `/apartments?company_slug=${TEMER_PARTNER.slug}` : '/apartments'

  const cmsCards = (content?.cards ?? []).filter((c) => c.title?.trim())
  const hasCmsBody = Boolean(
    content?.title?.trim() ||
      content?.description?.trim() ||
      cmsCards.length > 0 ||
      (content?.media?.length ?? 0) > 0 ||
      content?.video_url,
  )
  const queriesReady = !listingsQuery.isLoading && !contentQuery.isLoading
  const hasListings = listings.length > 0
  const pageExists = hasCmsBody || hasListings

  if (!projectSlug) {
    return <p className="text-sm text-red-600">{t('projectBrowse.missingProject')}</p>
  }

  if (projectSlug && visibility?.apartment[projectSlug] === false) {
    return (
      <div className="surface p-6 text-center">
        <p className="text-h3">{t('projectBrowse.notFoundTitle')}</p>
        <p className="mt-2 text-body-sm text-fg-muted">{t('projectBrowse.notFoundBody')}</p>
        <Link to={backTo} className="btn-primary mt-6 inline-flex">
          {t('projectBrowse.backToLocations')}
        </Link>
      </div>
    )
  }

  if (!queriesReady) {
    return <p className="text-body-sm">{t('projectBrowse.loading')}</p>
  }

  if (!pageExists) {
    return (
      <div className="surface p-6 text-center">
        <p className="text-h3">{t('projectBrowse.notFoundTitle')}</p>
        <p className="mt-2 text-body-sm text-fg-muted">{t('projectBrowse.notFoundBody')}</p>
        <Link to={backTo} className="btn-primary mt-6 inline-flex">
          {t('projectBrowse.backToLocations')}
        </Link>
      </div>
    )
  }

  const primaryImage = content?.media?.find((m) => m.is_primary && m.media_type === 'image')?.url
    ?? content?.media?.find((m) => m.media_type === 'image')?.url

  return (
    <div className="space-y-10 text-left">
      <nav className="text-sm text-fg-muted">
        <Link to={backTo} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
          {t('projectBrowse.backToLocations')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-fg">{pageTitle}</span>
      </nav>

      {primaryImage ? (
        <div className="overflow-hidden rounded-3xl border border-border">
          <img src={primaryImage} alt="" className="aspect-[21/9] w-full object-cover" />
        </div>
      ) : null}

      <header className="max-w-3xl">
        <p className="text-eyebrow text-brand-700 dark:text-brand-300">
          {t('projectBrowse.developerApartments', { developer: companyName })}
        </p>
        <h1 className="mt-2 text-h1">{content?.title || firstListing?.project_name || zone || projectSlug}</h1>
        {content?.subtitle ? <p className="mt-2 text-lg text-fg-muted">{content.subtitle}</p> : null}
        {content?.description ? (
          <p className="mt-4 whitespace-pre-line text-body-sm leading-relaxed">{content.description}</p>
        ) : (
          <p className="mt-4 text-body-sm text-fg-muted">{t('projectBrowse.locationIntroFallback')}</p>
        )}
      </header>

      <LocationDetailSections
        content={content}
        mediaTitle={t('projectBrowse.mediaTitle')}
        cardsTitle={t('projectBrowse.layoutsTitle')}
      />

      {isAyat ? (
        <section className="space-y-4">
          <h2 className="text-h3">{t('projectBrowse.priceEstimate')}</h2>
          <p className="max-w-2xl text-body-sm text-fg-muted">{t('projectBrowse.calculatorHint')}</p>
          <AyatPriceCalculator
            variant="page"
            initialKind="residential"
            initialResidentialProjectId={projectSlug}
          />
        </section>
      ) : null}

      {isTemer && hasListings ? (
        <section className="space-y-4">
          <h2 className="text-h3">{t('projectBrowse.homesHere')}</h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => (
              <li key={item.slug}>
                <TemerListingCard listing={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isTemer ? (
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

      <SiteContactStrip />
    </div>
  )
}
