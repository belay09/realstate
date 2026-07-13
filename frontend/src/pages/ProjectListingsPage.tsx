import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { api } from '../api/client'
import type { Paginated, PublicListingSummary, PublicLocationContent } from '../api/types'
import { AyatLocationHero } from '../components/AyatLocationHero'
import { AyatLocationSectionNav } from '../components/AyatLocationSectionNav'
import { FloorRateTable } from '../components/FloorRateTable'
import { ScrollReveal } from '../components/ScrollReveal'
import { AyatPriceCalculator } from '../components/AyatPriceCalculator'
import { GroupedLocationListingCards } from '../components/GroupedLocationListingCards'
import { LocationDetailSections } from '../components/LocationDetailSections'
import { SiteContactBanner } from '../components/SiteContactStrip'
import { TemerListingCard } from '../components/TemerListingCard'
import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import { SITE_CONTACT } from '../content/siteContact'
import { usePageTitle } from '../hooks/usePageTitle'
import { useCalculatorConfig } from '../hooks/useCalculatorConfig'
import { useLocationBrowseSummaries } from '../hooks/useLocationBrowseSummaries'
import { useLocationVisibility } from '../hooks/useLocationVisibility'
import { SHOW_PUBLIC_CALCULATOR } from '../lib/featureFlags'
import { developerResidentialPath } from '../lib/developerRoutes'
import { formatFloorBandLabel, formatUnitTypeLabel } from '../lib/ayatLabels'
import {
  isAdminPlaceholderDescription,
  shouldShowSubtitle,
} from '../lib/locationHeroText'
import { resolveDevelopmentZone } from '../lib/listingDisplay'
import {
  collectResidentialFloorRates,
  hasResidentialFloorRates,
} from '../lib/residentialFloorRates'

export function ProjectListingsPage() {
  const { t } = useTranslation()
  const { projectSlug } = useParams<{ projectSlug: string }>()
  const { data: visibility } = useLocationVisibility()
  const { data: calcConfig, isFetched: calcFetched } = useCalculatorConfig()
  const summariesQuery = useLocationBrowseSummaries('apartment')

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
  const browseSummary = projectSlug ? summariesQuery.data?.get(projectSlug) : undefined
  const companySlug = firstListing?.company_slug || browseSummary?.company_slug
  const companyName =
    firstListing?.company_name ??
    (companySlug === AYAT_PARTNER.slug
      ? AYAT_PARTNER.brandName
      : companySlug === TEMER_PARTNER.slug
        ? TEMER_PARTNER.brandName
        : 'Developer')
  const isAyat = companySlug === AYAT_PARTNER.slug
  const isTemer = companySlug === TEMER_PARTNER.slug

  const zone = projectSlug ? resolveDevelopmentZone(projectSlug, firstListing?.area ?? null) : ''
  const pageTitle = content?.title || firstListing?.project_name || zone || t('pageTitles.apartments')
  const seoDescription =
    content?.description?.trim()?.slice(0, 160) ||
    content?.subtitle?.trim() ||
    t('seo.projectDescriptionFallback')
  usePageTitle(pageTitle, seoDescription)

  const backTo =
    companySlug === AYAT_PARTNER.slug || companySlug === TEMER_PARTNER.slug
      ? developerResidentialPath(companySlug)
      : '/apartments'

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

  const heroTitle = content?.title || firstListing?.project_name || zone || projectSlug
  const rawSubtitle = content?.subtitle?.trim() || null
  const rawDescription = content?.description?.trim() || null
  const heroSubtitle =
    rawSubtitle && shouldShowSubtitle(rawSubtitle, heroTitle) ? rawSubtitle : null
  const listingHeroImage = listings.find((l) => l.primary_image_url?.trim())?.primary_image_url ?? null
  const heroImage = primaryImage ?? listingHeroImage

  const heroDescription = (() => {
    if (isAyat) {
      if (rawDescription && !isAdminPlaceholderDescription(rawDescription)) return rawDescription
      return t('projectBrowse.ayatLocationIntro')
    }
    return rawDescription || t('projectBrowse.locationIntroFallback')
  })()

  const layoutCount = listings.filter((l) => l.title?.trim()).length
  const heroVideoUrl = content?.video_url?.trim() || null
  const galleryImageCount = (content?.media ?? []).filter((m) => m.media_type === 'image').length

  const rateEntries =
    calcFetched && projectSlug ? collectResidentialFloorRates(calcConfig, projectSlug) : []
  const showRateTable = rateEntries.length > 0
  const showPriceOnRequest =
    calcFetched && !hasResidentialFloorRates(calcConfig, projectSlug)
  const contactPrefill = t('projectBrowse.whatsappPrefill', { location: heroTitle })

  const rateTableRows = rateEntries.map((row) => {
    const floorLabel = formatFloorBandLabel(row.floorBandLabel, t)
    const stagePrefix =
      row.completion === 'near_completion'
        ? `${t('calculator.completionNear')} · `
        : row.completion === 'unstarted'
          ? `${t('calculator.completionUnstarted')} · `
          : ''
    return {
      key: row.key,
      floorLabel: `${stagePrefix}${floorLabel}`,
      detailLabel: formatUnitTypeLabel(row.unitTypeCode, t),
      pricePerSqm: row.pricePerSqm,
    }
  })

  const ratesSection = showRateTable ? (
    <ScrollReveal animation="up">
      <FloorRateTable
        id="location-rates"
        title={t('projectBrowse.officialRatesTitle')}
        floorColumnLabel={t('projectBrowse.floorColumn')}
        detailColumnLabel={t('projectBrowse.homeTypeColumn')}
        priceColumnLabel={t('projectBrowse.pricePerSqmColumn')}
        note={t('projectBrowse.ratesNote')}
        rows={rateTableRows}
      />
    </ScrollReveal>
  ) : showPriceOnRequest ? (
    <section id="location-rates" className="scroll-mt-28 space-y-3 rounded-2xl border border-border bg-surface-muted/70 px-5 py-6 sm:px-6">
      <p className="section-eyebrow">{t('projectBrowse.priceOnRequestTitle')}</p>
      <p className="text-body-sm leading-relaxed">
        {t('projectBrowse.priceOnRequestBody', { phone: SITE_CONTACT.phoneDisplay })}
      </p>
    </section>
  ) : null

  const contactSection = (
    <ScrollReveal animation="fade" delayMs={100}>
      <div id="location-contact" className="scroll-mt-28">
        <SiteContactBanner whatsAppMessage={contactPrefill} hint={t('projectBrowse.contactHint')} />
      </div>
    </ScrollReveal>
  )

  if (isAyat) {
    const navSections = [
      ...(heroVideoUrl ? [{ id: 'location-video', label: t('projectBrowse.videoNav') }] : []),
      ...(galleryImageCount > 0
        ? [{ id: 'location-media', label: t('projectBrowse.galleryTitle') }]
        : []),
      ...(hasListings ? [{ id: 'location-layouts', label: t('projectBrowse.layoutsTitle') }] : []),
      ...(showRateTable || showPriceOnRequest
        ? [{ id: 'location-rates', label: t('projectBrowse.ratesNav') }]
        : []),
      { id: 'location-contact', label: t('projectBrowse.contactNav') },
      ...(SHOW_PUBLIC_CALCULATOR
        ? [{ id: 'location-calculator', label: t('projectBrowse.priceEstimate') }]
        : []),
    ]

    return (
      <div className="space-y-10 pb-8 text-left md:space-y-12">
        <AyatLocationHero
          backLabel={t('projectBrowse.backToLocations')}
          backTo={backTo}
          pageTitle={heroTitle}
          subtitle={heroSubtitle}
          description={heroDescription}
          coverImageUrl={heroVideoUrl ? null : heroImage}
          videoUrl={heroVideoUrl}
          developerLabel={t('projectBrowse.developerApartments', { developer: companyName })}
          layoutCount={layoutCount}
          layoutCountLabel={
            layoutCount === 1
              ? `1 ${t('projectBrowse.layoutAvailable')}`
              : `${layoutCount} ${t('projectBrowse.layoutsAvailable')}`
          }
          viewLayoutsLabel={t('projectBrowse.viewLayouts')}
          videoBadgeLabel={t('projectBrowse.videoBadge')}
        />

        <AyatLocationSectionNav sections={navSections} />

        <LocationDetailSections
          content={content}
          mediaTitle={t('projectBrowse.galleryTitle')}
          mediaDescription={t('projectBrowse.gallerySubtitle')}
          cardsTitle={t('projectBrowse.layoutsTitle')}
          showLayoutCards={false}
          hideMainVideo={Boolean(heroVideoUrl)}
        />

        {hasListings ? (
          <GroupedLocationListingCards
            locationId={projectSlug}
            listings={listings}
            settings={content?.settings}
            title={t('projectBrowse.layoutsTitle')}
            subtitle={t('projectBrowse.layoutsIntro')}
          />
        ) : null}

        {ratesSection}

        {SHOW_PUBLIC_CALCULATOR ? (
          <ScrollReveal animation="scale" id="location-calculator">
            <section className="calculator-panel-glow scroll-mt-28 overflow-hidden rounded-3xl border border-border bg-surface/90 shadow-xl shadow-brand-900/5 backdrop-blur-sm dark:bg-surface/80">
              <div className="relative border-b border-border px-5 py-6 sm:px-8 md:px-10">
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-violet-500/5"
                  aria-hidden
                />
                <p className="relative text-eyebrow text-brand-700 dark:text-brand-300">
                  {t('projectBrowse.priceEstimate')}
                </p>
                <h2 className="relative mt-2 text-2xl font-bold tracking-tight text-fg md:text-3xl">
                  {t('projectBrowse.calculatorHeadline')}
                </h2>
                <p className="relative mt-2 max-w-2xl text-body-sm leading-relaxed text-fg-muted">
                  {t('projectBrowse.calculatorHint')}
                </p>
              </div>
              <div className="p-4 sm:p-6 md:p-8">
                <AyatPriceCalculator
                  variant="page"
                  layout="compact"
                  initialKind="residential"
                  initialResidentialProjectId={projectSlug}
                />
              </div>
            </section>
          </ScrollReveal>
        ) : null}

        {contactSection}
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-8 text-left md:space-y-12">
      <nav className="text-sm text-fg-muted">
        <Link to={backTo} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
          ← {t('projectBrowse.backToLocations')}
        </Link>
      </nav>

      {primaryImage ? (
        <div className="overflow-hidden rounded-[1.5rem] border border-border shadow-[0_24px_56px_-28px_rgba(15,23,42,0.22)]">
          <img src={primaryImage} alt="" className="aspect-[21/9] w-full object-cover sm:aspect-[2.4/1]" />
        </div>
      ) : null}

      <header className="max-w-3xl">
        <p className="text-eyebrow">
          {t('projectBrowse.developerApartments', { developer: companyName })}
        </p>
        <h1 className="mt-3 text-h1">{heroTitle}</h1>
        {heroSubtitle ? <p className="mt-3 text-lg font-medium text-fg-muted">{heroSubtitle}</p> : null}
        {heroDescription ? (
          <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-fg-muted">{heroDescription}</p>
        ) : null}
      </header>

      <LocationDetailSections
        content={content}
        mediaTitle={t('projectBrowse.mediaTitle')}
        cardsTitle={t('projectBrowse.layoutsTitle')}
      />

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

      {ratesSection}

      {contactSection}
    </div>
  )
}
