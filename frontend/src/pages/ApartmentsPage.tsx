import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { api } from '../api/client'
import type { Paginated, PublicListingSummary } from '../api/types'
import { ProjectLocationCard } from '../components/ProjectLocationCard'
import { SiteContactBanner } from '../components/SiteContactStrip'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import { groupListingsByProject } from '../lib/groupListingsByProject'
import { useTranslation } from '../context/LocaleContext'
import { usePageTitle } from '../hooks/usePageTitle'

function LocationSkeleton() {
  return (
    <div className="surface overflow-hidden p-0">
      <div className="aspect-[4/5] animate-pulse bg-surface-muted" />
      <div className="h-16 animate-pulse bg-canvas" />
    </div>
  )
}

type DeveloperFilter = '' | typeof AYAT_PARTNER.slug | typeof TEMER_PARTNER.slug

export function ApartmentsPage() {
  const { t } = useTranslation()
  usePageTitle(t('pageTitles.apartments'))
  const [searchParams, setSearchParams] = useSearchParams()
  const companySlug = (searchParams.get('company_slug') || '') as DeveloperFilter

  const setDeveloperFilter = (slug: DeveloperFilter) => {
    const next = new URLSearchParams(searchParams)
    if (slug) {
      next.set('company_slug', slug)
    } else {
      next.delete('company_slug')
    }
    setSearchParams(next, { replace: true })
  }

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

  const projectGroups = React.useMemo(
    () => groupListingsByProject(query.data?.items ?? []),
    [query.data?.items],
  )

  const filterChipClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      active
        ? 'bg-brand-700 text-white shadow dark:bg-brand-500'
        : 'border border-border bg-surface text-fg-muted hover:border-brand-300 hover:text-fg'
    }`

  return (
    <div className="space-y-10 overflow-visible text-left">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-14 sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-40">
          <div className="h-full w-full bg-gradient-to-l from-brand-600/30 to-transparent" />
        </div>
        <div className="relative max-w-2xl">
          <p className="text-eyebrow text-brand-300">{t('apartments.heroEyebrow')}</p>
          <h1 className="mt-4 text-h1 text-white">{t('apartments.heroTitle')}</h1>
          <p className="text-lead mt-5 text-slate-400">{t('apartments.heroBody')}</p>
        </div>
      </section>

      <SiteContactBanner />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={filterChipClass(!companySlug)} onClick={() => setDeveloperFilter('')}>
          {t('apartments.filterAll')}
        </button>
        <button
          type="button"
          className={filterChipClass(companySlug === AYAT_PARTNER.slug)}
          onClick={() => setDeveloperFilter(AYAT_PARTNER.slug)}
        >
          {t('apartments.filterAyat')}
        </button>
        <button
          type="button"
          className={filterChipClass(companySlug === TEMER_PARTNER.slug)}
          onClick={() => setDeveloperFilter(TEMER_PARTNER.slug)}
        >
          {t('apartments.filterTemer')}
        </button>
      </div>

      <p className="text-body-sm text-fg-muted">{t('apartments.pickLocation')}</p>

      {query.isError && (
        <p className="surface border-red-300 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {t('listings.loadError')}
        </p>
      )}

      {query.isLoading && (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i}>
              <LocationSkeleton />
            </li>
          ))}
        </ul>
      )}

      {!query.isLoading && projectGroups.length > 0 && (
        <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {projectGroups.map((group) => (
            <li key={`${group.company_slug}-${group.project_slug}`} className="animate-fade-in">
              <ProjectLocationCard group={group} />
            </li>
          ))}
        </ul>
      )}

      {query.data && projectGroups.length === 0 && !query.isLoading && (
        <div className="surface flex flex-col items-center px-6 py-20 text-center">
          <p className="text-h2">{t('listings.emptyTitle')}</p>
          <p className="mt-2 max-w-md text-body-sm">{t('listings.emptyDescription')}</p>
          <Link to="/apartments" className="btn-primary mt-8">
            {t('apartments.filterAll')}
          </Link>
        </div>
      )}
    </div>
  )
}
