import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../api/client'
import type { Paginated, PublicListingSummary } from '../api/types'
import { ProjectLocationCard } from '../components/ProjectLocationCard'
import { groupListingsByProject } from '../lib/groupListingsByProject'
import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER } from '../content/partners'
import { usePageTitle } from '../hooks/usePageTitle'

function LocationSkeleton() {
  return (
    <div className="surface overflow-hidden p-0">
      <div className="aspect-[4/5] animate-pulse bg-surface-muted" />
      <div className="h-16 animate-pulse bg-canvas" />
    </div>
  )
}

export function ApartmentsPage() {
  const { t } = useTranslation()
  usePageTitle(t('pageTitles.apartments'))

  const query = useQuery({
    queryKey: ['public-listings-apartments'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<PublicListingSummary>>('/public/listings', {
        params: { limit: '100' },
      })
      return data
    },
  })

  const projectGroups = React.useMemo(
    () => groupListingsByProject(query.data?.items ?? []),
    [query.data?.items],
  )

  return (
    <div className="space-y-10 overflow-visible text-left">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-950 px-6 py-12 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-eyebrow text-brand-200">{t('apartments.heroEyebrow')}</p>
          <h1 className="mt-3 text-h1 text-white">{t('apartments.heroTitle')}</h1>
          <p className="mt-4 text-body-sm text-slate-100/90 sm:text-base">{t('apartments.heroBody')}</p>
        </div>
      </section>

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
            <li key={group.project_slug} className="animate-fade-in">
              <ProjectLocationCard group={group} />
            </li>
          ))}
        </ul>
      )}

      {query.data && projectGroups.length === 0 && !query.isLoading && (
        <div className="surface flex flex-col items-center px-6 py-20 text-center">
          <p className="text-h2">{t('listings.emptyTitle')}</p>
          <p className="mt-2 max-w-md text-body-sm">{t('listings.emptyDescription')}</p>
          <Link
            to={`/apartments?company_slug=${AYAT_PARTNER.slug}`}
            className="btn-primary mt-8"
          >
            {t('listings.ayatHomesOnly')}
          </Link>
        </div>
      )}
    </div>
  )
}
