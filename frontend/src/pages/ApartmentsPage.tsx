import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { api } from '../api/client'
import type { Paginated, PublicListingSummary } from '../api/types'
import { ProjectLocationCard } from '../components/ProjectLocationCard'
import { TemerListingCard } from '../components/TemerListingCard'
import { SITE_CONTACT, siteWhatsAppHref } from '../content/siteContact'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import { useTranslation } from '../context/LocaleContext'
import { groupListingsByProject } from '../lib/groupListingsByProject'
import { usePageTitle } from '../hooks/usePageTitle'

function PhoneIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  )
}

function TemerCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="aspect-[4/3] animate-pulse bg-surface-muted" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-4/5 animate-pulse rounded bg-surface-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-surface-muted" />
        <div className="grid grid-cols-3 gap-2 py-2">
          <div className="h-10 animate-pulse rounded bg-surface-muted" />
          <div className="h-10 animate-pulse rounded bg-surface-muted" />
          <div className="h-10 animate-pulse rounded bg-surface-muted" />
        </div>
      </div>
    </div>
  )
}

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

  const isTemerBrowse = companySlug === TEMER_PARTNER.slug
  const listings = query.data?.items ?? []

  const heroCopy = React.useMemo(() => {
    if (companySlug === AYAT_PARTNER.slug) {
      return {
        eyebrow: t('apartments.heroEyebrowAyat'),
        title: t('apartments.heroTitleFiltered'),
        accent: t('apartments.heroTitleAccentAyat'),
      }
    }
    if (companySlug === TEMER_PARTNER.slug) {
      return {
        eyebrow: t('apartments.heroEyebrowTemer'),
        title: t('apartments.heroTitleFiltered'),
        accent: t('apartments.heroTitleAccentTemer'),
      }
    }
    return {
      eyebrow: t('apartments.heroEyebrow'),
      title: t('apartments.heroTitle'),
      accent: t('apartments.heroTitleAccent'),
    }
  }, [companySlug, t])

  const countHint =
    query.data && !query.isLoading
      ? t('apartments.resultsHint', {
          developments: isTemerBrowse ? listings.length : projectGroups.length,
          homes: query.data.total,
        })
      : null

  const hasResults = isTemerBrowse ? listings.length > 0 : projectGroups.length > 0

  return (
    <div className="space-y-10 text-left">
      <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_24px_60px_-28px_rgba(15,23,42,0.18)]">
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl"
            aria-hidden
          />
          <div className="relative max-w-2xl">
            <p className="text-eyebrow">{heroCopy.eyebrow}</p>
            <h1 className="text-h1 mt-3">
              {heroCopy.title}
              <span className="text-brand-700 dark:text-brand-400"> {heroCopy.accent}</span>
            </h1>
            <p className="text-lead mt-4 max-w-lg">{t('apartments.heroBody')}</p>

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex flex-wrap gap-2">
                <FilterChip active={!companySlug} onClick={() => setDeveloperFilter('')}>
                  {t('apartments.filterAll')}
                </FilterChip>
                <FilterChip
                  active={companySlug === AYAT_PARTNER.slug}
                  onClick={() => setDeveloperFilter(AYAT_PARTNER.slug)}
                >
                  {t('apartments.filterAyat')}
                </FilterChip>
                <FilterChip
                  active={companySlug === TEMER_PARTNER.slug}
                  onClick={() => setDeveloperFilter(TEMER_PARTNER.slug)}
                >
                  {t('apartments.filterTemer')}
                </FilterChip>
              </div>
              {countHint ? (
                <p className="text-sm font-medium text-fg-muted">{countHint}</p>
              ) : null}
            </div>

            <p className="mt-5 text-body-sm text-fg-muted">
              {isTemerBrowse ? t('temerCard.browseIntro') : t('apartments.pickLocation')}
            </p>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-6 py-5 sm:px-10 sm:py-6">
          <div
            className="pointer-events-none absolute -bottom-10 right-0 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-900/40">
                <PhoneIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-brand-300">
                  {t('contact.label')}
                </p>
                <a
                  href={SITE_CONTACT.telHref}
                  className="mt-1 block text-2xl font-bold tracking-tight text-white transition hover:text-brand-200"
                >
                  {SITE_CONTACT.phoneDisplay}
                </a>
                <p className="mt-1 text-sm text-slate-400">{t('contact.bannerHint')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <a
                href={SITE_CONTACT.telHref}
                className="btn-luxury-light py-2 pl-5 pr-1.5 text-xs normal-case tracking-normal sm:text-sm"
              >
                <span>{t('contact.call')}</span>
                <span className="btn-luxury-icon h-8 w-8 bg-slate-950 text-white">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </a>
              <a
                href={siteWhatsAppHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-white/30 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 sm:text-sm"
              >
                {t('contact.whatsapp')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {query.isError && (
        <p className="surface border-red-300 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {t('listings.loadError')}
        </p>
      )}

      {query.isLoading && (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>{isTemerBrowse ? <TemerCardSkeleton /> : <LocationSkeleton />}</li>
          ))}
        </ul>
      )}

      {!query.isLoading && isTemerBrowse && listings.length > 0 && (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => (
            <li key={item.slug} className="animate-fade-in">
              <TemerListingCard listing={item} />
            </li>
          ))}
        </ul>
      )}

      {!query.isLoading && !isTemerBrowse && projectGroups.length > 0 && (
        <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {projectGroups.map((group) => (
            <li key={`${group.company_slug}-${group.project_slug}`} className="animate-fade-in">
              <ProjectLocationCard group={group} />
            </li>
          ))}
        </ul>
      )}

      {query.data && !hasResults && !query.isLoading && (
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
