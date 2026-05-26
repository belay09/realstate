import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { api } from '../api/client'
import type { Paginated, PublicListingSummary } from '../api/types'
import {
  emptyListingFilters,
  ListingFilters,
  type ListingFiltersState,
} from '../components/ListingFilters'
import { ListingCard } from '../components/ListingCard'
import { PartnerAyatSection } from '../components/PartnerAyatSection'
import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER } from '../content/partners'
import { usePageTitle } from '../hooks/usePageTitle'

const QUICK_FILTER_IDS = [
  { id: 'ayat-area', key: 'listings.quickAyatArea' as const, values: { area: 'Ayat (Main Village)' } },
  { id: 'lideta', key: 'listings.quickLideta' as const, values: { area: 'Lideta' } },
  { id: 'kazanchis', key: 'listings.quickKazanchis' as const, values: { area: 'Kazanchis' } },
  { id: 'bole', key: 'listings.quickBole' as const, values: { area: 'Bole (Belair)' } },
  { id: 'cmc', key: 'listings.quickCmc' as const, values: { area: 'CMC' } },
  { id: '2br', key: 'listings.quick2br' as const, values: { bedrooms: '2' } },
  { id: '3br', key: 'listings.quick3br' as const, values: { bedrooms: '3' } },
  {
    id: 'ayat-co',
    key: 'listings.quickAyatCo' as const,
    values: { company_slug: 'ayat-real-estate' },
  },
]

function ListingSkeleton() {
  return (
    <div className="surface overflow-hidden p-0">
      <div className="aspect-[4/5] animate-pulse bg-surface-muted" />
      <div className="h-16 animate-pulse bg-canvas" />
    </div>
  )
}

function filtersFromSearchParams(params: URLSearchParams): ListingFiltersState {
  return {
    city: params.get('city') ?? '',
    area: params.get('area') ?? '',
    bedrooms: params.get('bedrooms') ?? '',
    company_slug: params.get('company_slug') ?? '',
    unit_type_code: params.get('unit_type_code') ?? '',
  }
}

export function ListingsPage() {
  const { t } = useTranslation()
  usePageTitle(t('pageTitles.listings'))
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = React.useState<ListingFiltersState>(() =>
    filtersFromSearchParams(searchParams),
  )

  const quickFilters = QUICK_FILTER_IDS.map(({ id, key, values }) => ({
    id,
    label: t(key),
    values: { ...emptyListingFilters, ...values },
  }))

  React.useEffect(() => {
    setFilters(filtersFromSearchParams(searchParams))
  }, [searchParams])

  const query = useQuery({
    queryKey: ['public-listings', filters],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (filters.city) params.city = filters.city
      if (filters.area) params.area = filters.area
      if (filters.bedrooms) params.bedrooms = filters.bedrooms
      if (filters.company_slug) params.company_slug = filters.company_slug
      if (filters.unit_type_code) params.unit_type_code = filters.unit_type_code
      const { data } = await api.get<Paginated<PublicListingSummary>>('/public/listings', { params })
      return data
    },
  })

  const applyFilters = (next: ListingFiltersState) => {
    setFilters(next)
    const params = new URLSearchParams()
    if (next.city) params.set('city', next.city)
    if (next.area) params.set('area', next.area)
    if (next.bedrooms) params.set('bedrooms', next.bedrooms)
    if (next.company_slug) params.set('company_slug', next.company_slug)
    if (next.unit_type_code) params.set('unit_type_code', next.unit_type_code)
    setSearchParams(params, { replace: true })
  }

  const total = query.data?.total ?? 0

  return (
    <div className="space-y-12 text-left">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-950 px-6 py-12 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-eyebrow text-brand-200">{t('listings.heroEyebrow')}</p>
          <h1 className="mt-3 text-h1 text-white">{t('listings.heroTitle')}</h1>
          <p className="mt-4 text-body-sm text-slate-100/90 sm:text-base">
            {t('listings.heroBody', { ayatBrand: AYAT_PARTNER.brandName })}
          </p>
        </div>
      </section>

      <div className="surface flex flex-col gap-4 border-brand-200/60 bg-brand-50/50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-brand-800/40 dark:bg-brand-950/30">
        <p className="text-sm text-fg-muted">{t('listings.shopsCalculatorNote')}</p>
        <Link to="/calculator?kind=shop" className="btn-primary shrink-0">
          {t('listings.estimateShop')}
        </Link>
      </div>

      <PartnerAyatSection compact />

      <ListingFilters
        filters={filters}
        total={total}
        isLoading={query.isLoading}
        quickFilters={quickFilters}
        onApply={applyFilters}
        onReset={() => applyFilters(emptyListingFilters)}
      />

      {query.isError && (
        <p className="surface border-red-300 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {t('listings.loadError')}
        </p>
      )}

      {query.isLoading && (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <ListingSkeleton />
            </li>
          ))}
        </ul>
      )}

      {!query.isLoading && query.data && query.data.items.length > 0 && (
        <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.items.map((item) => (
            <li key={item.id} className="animate-fade-in">
              <ListingCard item={item} />
            </li>
          ))}
        </ul>
      )}

      {query.data && query.data.items.length === 0 && !query.isLoading && (
        <div className="surface flex flex-col items-center px-6 py-20 text-center">
          <p className="text-h2">{t('listings.emptyTitle')}</p>
          <p className="mt-2 max-w-md text-body-sm">{t('listings.emptyDescription')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-secondary" onClick={() => applyFilters(emptyListingFilters)}>
              {t('listings.showAll')}
            </button>
            <Link to="/listings?company_slug=ayat-real-estate" className="btn-primary">
              {t('listings.ayatHomesOnly')}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
