import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { api } from '../api/client'
import type { Paginated, PublicListingSummary } from '../api/types'
import { ListingCard } from '../components/ListingCard'
import { useTranslation } from '../context/LocaleContext'
import { formatBedroomCount } from '../lib/ayatLabels'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatListingLocation, resolveDevelopmentZone } from '../lib/listingDisplay'

function filtersFromSearchParams(params: URLSearchParams) {
  return {
    city: params.get('city') ?? '',
    area: params.get('area') ?? '',
    bedrooms: params.get('bedrooms') ?? '',
    company_slug: params.get('company_slug') ?? '',
    unit_type_code: params.get('unit_type_code') ?? '',
  }
}

export function ProjectListingsPage() {
  const { t } = useTranslation()
  const { projectSlug } = useParams<{ projectSlug: string }>()
  const [searchParams] = useSearchParams()
  const urlFilters = filtersFromSearchParams(searchParams)
  const [bedroomFilter, setBedroomFilter] = React.useState(urlFilters.bedrooms)

  React.useEffect(() => {
    setBedroomFilter(urlFilters.bedrooms)
  }, [urlFilters.bedrooms])

  const query = useQuery({
    queryKey: ['public-listings-project', projectSlug, urlFilters],
    enabled: Boolean(projectSlug),
    queryFn: async () => {
      const params: Record<string, string> = { project_slug: projectSlug!, limit: '50' }
      if (urlFilters.city) params.city = urlFilters.city
      if (urlFilters.area) params.area = urlFilters.area
      if (urlFilters.bedrooms) params.bedrooms = urlFilters.bedrooms
      if (urlFilters.company_slug) params.company_slug = urlFilters.company_slug
      if (urlFilters.unit_type_code) params.unit_type_code = urlFilters.unit_type_code
      const { data } = await api.get<Paginated<PublicListingSummary>>('/public/listings', { params })
      return data
    },
  })

  const sample = query.data?.items[0]
  const zone = sample ? resolveDevelopmentZone(sample.project_slug, sample.area) : ''
  const pageTitle = zone || sample?.project_name || t('pageTitles.listings')
  usePageTitle(pageTitle)

  const bedroomOptions = React.useMemo(() => {
    const beds = new Set(
      (query.data?.items ?? [])
        .map((l) => l.bedrooms)
        .filter((b): b is number => b != null),
    )
    return [...beds].sort((a, b) => a - b)
  }, [query.data?.items])

  const visibleListings = React.useMemo(() => {
    const items = query.data?.items ?? []
    if (!bedroomFilter) return items
    return items.filter((l) => String(l.bedrooms ?? '') === bedroomFilter)
  }, [query.data?.items, bedroomFilter])

  const backSearch = searchParams.toString()
  const backTo = backSearch ? `/listings?${backSearch}` : '/listings'

  if (!projectSlug) {
    return <p className="text-sm text-red-600">{t('projectBrowse.missingProject')}</p>
  }

  if (query.isLoading) {
    return <p className="text-body-sm">{t('projectBrowse.loading')}</p>
  }

  if (query.isError || !sample) {
    return (
      <div className="surface p-6 text-center">
        <p className="text-h3">{t('projectBrowse.notFoundTitle')}</p>
        <p className="mt-2 text-body-sm text-fg-muted">{t('projectBrowse.notFoundBody')}</p>
        <Link to="/listings" className="btn-primary mt-6 inline-flex">
          {t('projectBrowse.backToLocations')}
        </Link>
      </div>
    )
  }

  const location = formatListingLocation(sample, t)

  return (
    <div className="space-y-10 text-left">
      <nav className="text-sm text-fg-muted">
        <Link to={backTo} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
          {t('projectBrowse.backToLocations')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-fg">{zone || sample.project_name}</span>
      </nav>

      <header className="max-w-2xl">
        <p className="text-eyebrow text-brand-700 dark:text-brand-300">{sample.company_name}</p>
        <h1 className="mt-2 text-h1">{zone || sample.project_name}</h1>
        {sample.project_name && zone && sample.project_name !== zone ? (
          <p className="mt-1 text-lg text-fg-muted">{sample.project_name}</p>
        ) : null}
        <p className="mt-3 text-body-sm text-fg-muted">{location}</p>
        <p className="mt-4 text-body-sm">{t('projectBrowse.chooseLayout')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/calculator" className="btn-secondary">
            {t('projectBrowse.priceEstimate')}
          </Link>
        </div>
      </header>

      {bedroomOptions.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {t('projectBrowse.filterBedrooms')}
          </span>
          <button
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              !bedroomFilter
                ? 'bg-brand-600 text-white'
                : 'bg-surface-muted text-fg hover:bg-brand-50 dark:hover:bg-brand-950'
            }`}
            onClick={() => setBedroomFilter('')}
          >
            {t('filters.any')}
          </button>
          {bedroomOptions.map((n) => (
            <button
              key={n}
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                bedroomFilter === String(n)
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-muted text-fg hover:bg-brand-50 dark:hover:bg-brand-950'
              }`}
              onClick={() => setBedroomFilter(String(n))}
            >
              {n === 1 || n === 2 || n === 3 ? formatBedroomCount(n, t) : String(n)}
            </button>
          ))}
        </div>
      ) : null}

      {visibleListings.length > 0 ? (
        <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {visibleListings.map((item) => (
            <li key={item.id} className="animate-fade-in">
              <ListingCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="surface p-8 text-center">
          <p className="text-body-sm text-fg-muted">{t('projectBrowse.noBedroomMatch')}</p>
          <button
            type="button"
            className="btn-secondary mt-4"
            onClick={() => setBedroomFilter('')}
          >
            {t('projectBrowse.showAllLayouts')}
          </button>
        </div>
      )}
    </div>
  )
}
