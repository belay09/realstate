import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { api } from '../api/client'
import type { Paginated, PublicListingSummary } from '../api/types'
import { ProjectLocationCard } from '../components/ProjectLocationCard'
import { ProductKindSwitcher } from '../components/ProductKindSwitcher'
import { SITE_CONTACT, siteWhatsAppHref } from '../content/siteContact'
import { AYAT_PARTNER, TEMER_PARTNER, partnerForSlug } from '../content/partners'
import { useTranslation } from '../context/LocaleContext'
import { filterApartmentBrowseListings } from '../lib/apartmentBrowseListings'
import { developerKindPath } from '../lib/developerRoutes'
import { groupListingsByProject } from '../lib/groupListingsByProject'
import { mergeApartmentBrowseGroups } from '../lib/mergeApartmentBrowseGroups'
import { usePageTitle } from '../hooks/usePageTitle'
import { useLocationBrowseSummaries } from '../hooks/useLocationBrowseSummaries'
import { useLocationVisibility } from '../hooks/useLocationVisibility'

function LocationSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="aspect-[3/2] animate-pulse bg-surface-muted" />
      <div className="space-y-3 p-6">
        <div className="h-4 w-1/3 animate-pulse rounded bg-surface-muted" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-surface-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-surface-muted" />
      </div>
    </div>
  )
}

type DeveloperFilter = '' | typeof AYAT_PARTNER.slug | typeof TEMER_PARTNER.slug

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
          : 'border border-border bg-surface text-fg-muted hover:border-brand-400 hover:text-fg'
      }`}
    >
      {children}
    </button>
  )
}

export function ApartmentsPage() {
  const { t } = useTranslation()
  usePageTitle(t('pageTitles.apartments'), t('seo.apartmentsDescription'))
  const [searchParams, setSearchParams] = useSearchParams()
  const companySlug = (searchParams.get('company_slug') || '') as DeveloperFilter
  const partner = partnerForSlug(companySlug)

  const setDeveloperFilter = (slug: DeveloperFilter) => {
    const next = new URLSearchParams(searchParams)
    if (slug) {
      next.set('company_slug', slug)
    } else {
      next.delete('company_slug')
    }
    setSearchParams(next, { replace: true })
  }

  const visibilityQuery = useLocationVisibility()
  const locationSummariesQuery = useLocationBrowseSummaries('apartment')

  const query = useQuery({
    queryKey: ['public-listings-apartments', companySlug],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '100' }
      if (companySlug) {
        params.company_slug = companySlug
      }
      const { data } = await api.get<Paginated<PublicListingSummary>>('/public/listings', {
        params,
      })
      return data
    },
  })

  const projectGroups = React.useMemo(() => {
    const residential = filterApartmentBrowseListings(query.data?.items ?? [])
    const groups = groupListingsByProject(residential)
    return mergeApartmentBrowseGroups(
      groups,
      locationSummariesQuery.data,
      visibilityQuery.data,
      companySlug,
    )
  }, [query.data?.items, visibilityQuery.data, locationSummariesQuery.data, companySlug])

  const hasResults = projectGroups.length > 0
  const pageLoading = query.isLoading || locationSummariesQuery.isLoading

  const title = partner?.brandName ?? t('apartments.heroTitle')
  const subtitle = partner ? t('apartments.heroBodyFiltered') : t('apartments.heroBody')

  return (
    <div className="space-y-10 text-left md:space-y-12">
      <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-xl">
          {partner ? <p className="text-eyebrow">{t('developer.kindResidential')}</p> : null}
          <h1 className={`text-h1 ${partner ? 'mt-3' : ''}`}>{title}</h1>
          <p className="mt-3 text-body-sm text-fg-muted">{subtitle}</p>
        </div>
        {companySlug ? (
          <ProductKindSwitcher companySlug={companySlug} active="residential" className="w-full shrink-0 sm:w-auto" />
        ) : (
          <div className="flex flex-wrap gap-2">
            <FilterChip active onClick={() => setDeveloperFilter('')}>
              {t('apartments.filterAll')}
            </FilterChip>
            <FilterChip active={false} onClick={() => setDeveloperFilter(AYAT_PARTNER.slug)}>
              {t('apartments.filterAyat')}
            </FilterChip>
            <FilterChip active={false} onClick={() => setDeveloperFilter(TEMER_PARTNER.slug)}>
              {t('apartments.filterTemer')}
            </FilterChip>
          </div>
        )}
      </header>

      {query.isError && (
        <p className="surface border-red-300 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {t('listings.loadError')}
        </p>
      )}

      {pageLoading && (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <LocationSkeleton />
            </li>
          ))}
        </ul>
      )}

      {!pageLoading && projectGroups.length > 0 && (
        <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {projectGroups.map((group) => (
            <li key={`${group.company_slug}-${group.project_slug}`} className="animate-fade-in">
              <ProjectLocationCard
                group={group}
                locationCms={locationSummariesQuery.data?.get(group.project_slug)}
              />
            </li>
          ))}
        </ul>
      )}

      {query.data && !hasResults && !pageLoading && (
        <div className="surface flex flex-col items-center px-6 py-20 text-center">
          <p className="text-h2">{t('listings.emptyTitle')}</p>
          <p className="mt-2 max-w-md text-body-sm">{t('listings.emptyDescription')}</p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
            <a href={SITE_CONTACT.telHref} className="btn-primary w-full justify-center sm:w-auto">
              {t('contact.call')}
            </a>
            <a
              href={siteWhatsAppHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full justify-center sm:w-auto"
            >
              {t('contact.whatsapp')}
            </a>
            {companySlug ? (
              <Link to={developerKindPath(companySlug)} className="btn-secondary w-full justify-center sm:w-auto">
                {t('developer.backToKind')}
              </Link>
            ) : (
              <Link to="/apartments" className="btn-secondary w-full justify-center sm:w-auto">
                {t('apartments.filterAll')}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
