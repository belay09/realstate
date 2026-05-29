import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

import { api } from '../api/client'
import type { PublicListingFilterOptions } from '../api/types'
import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import { AYAT_ZONE_FILTER_OPTIONS } from '../lib/listingDisplay'
import { SearchableSelect, type SelectOption } from './SearchableSelect'

export type ListingFiltersState = {
  city: string
  area: string
  bedrooms: string
  company_slug: string
  unit_type_code: string
}

export const emptyListingFilters: ListingFiltersState = {
  city: '',
  area: '',
  bedrooms: '',
  company_slug: '',
  unit_type_code: '',
}

type QuickFilter = { id: string; label: string; values: ListingFiltersState }

type ListingFiltersProps = {
  filters: ListingFiltersState
  total: number | string
  locationCount?: number
  isLoading: boolean
  quickFilters: QuickFilter[]
  onApply: (filters: ListingFiltersState) => void
  onReset: () => void
}

function filtersMatch(a: ListingFiltersState, b: ListingFiltersState) {
  return (
    a.city === b.city &&
    a.area === b.area &&
    a.bedrooms === b.bedrooms &&
    a.company_slug === b.company_slug &&
    a.unit_type_code === b.unit_type_code
  )
}

const TEMER_AREA_OPTIONS = [
  { value: 'Sarbet', label: 'Sarbet' },
  { value: 'Aware', label: 'Aware' },
  { value: 'Ayat', label: 'Ayat' },
  { value: 'Gelan', label: 'Gelan' },
  { value: 'Garment', label: 'Garment' },
  { value: 'Piyassa', label: 'Piyassa' },
]

const FALLBACK_OPTIONS: PublicListingFilterOptions = {
  areas: [
    ...AYAT_ZONE_FILTER_OPTIONS,
    ...TEMER_AREA_OPTIONS.filter(
      (opt) => !AYAT_ZONE_FILTER_OPTIONS.some((a) => a.value === opt.value),
    ),
  ],
  cities: [{ value: 'Addis Ababa', label: 'Addis Ababa' }],
  bedrooms: [
    { value: '1', label: '1 bedroom' },
    { value: '2', label: '2 bedrooms' },
    { value: '3', label: '3 bedrooms' },
  ],
  companies: [
    { value: AYAT_PARTNER.slug, label: AYAT_PARTNER.legalName },
    { value: TEMER_PARTNER.slug, label: TEMER_PARTNER.brandName },
  ],
  unit_types: [],
}

export function ListingFilters({
  filters,
  total,
  locationCount,
  isLoading,
  quickFilters,
  onApply,
  onReset,
}: ListingFiltersProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = React.useState<ListingFiltersState>(filters)

  React.useEffect(() => {
    setDraft(filters)
  }, [filters])

  const optionsQuery = useQuery({
    queryKey: ['public-listing-filter-options'],
    queryFn: async () => {
      const { data } = await api.get<PublicListingFilterOptions>('/public/listings/filter-options')
      return data
    },
    staleTime: 60_000,
  })

  const opts = optionsQuery.data ?? FALLBACK_OPTIONS

  const countLabel = isLoading
    ? t('filters.loading')
    : locationCount != null && locationCount > 0
      ? t('filters.locationsAndHomes', {
          locations: locationCount,
          homes: total,
        })
      : `${total} ${total === 1 ? t('filters.property') : t('filters.properties')} ${t('filters.available')}`

  const patch = (partial: Partial<ListingFiltersState>) => {
    setDraft((prev) => ({ ...prev, ...partial }))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onApply(draft)
  }

  const field = (
    key: keyof ListingFiltersState,
    label: string,
    options: SelectOption[],
    placeholder: string,
  ) => (
    <SearchableSelect
      id={`filter-${key}`}
      name={key}
      label={label}
      value={draft[key]}
      options={options}
      placeholder={placeholder}
      emptyLabel={t('filters.any')}
      onChange={(value) => patch({ [key]: value })}
    />
  )

  return (
    <div className="surface relative z-30 overflow-visible">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-fg">{t('filters.findHome')}</p>
            <p className="mt-0.5 text-xs text-fg-muted">{countLabel}</p>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
            onClick={() => {
              setDraft(emptyListingFilters)
              onReset()
            }}
          >
            {t('filters.clearAll')}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickFilters.map(({ id, label, values }) => (
            <button
              key={id}
              type="button"
              className={filtersMatch(filters, values) ? 'chip chip-active' : 'chip'}
              onClick={() => {
                setDraft(values)
                onApply(values)
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {field('area', t('filters.neighborhood'), opts.areas, t('filters.neighborhoodPlaceholder'))}
            {field('city', t('filters.city'), opts.cities, t('filters.cityPlaceholder'))}
            {field('bedrooms', t('filters.bedrooms'), opts.bedrooms, t('filters.bedroomsPlaceholder'))}
            {field('company_slug', t('filters.developer'), opts.companies, t('filters.developerPlaceholder'))}
            {field(
              'unit_type_code',
              t('filters.unitType'),
              opts.unit_types,
              t('filters.unitTypePlaceholder'),
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary">
              {t('filters.search')}
            </button>
            {optionsQuery.isLoading ? (
              <span className="text-xs text-fg-muted">{t('filters.optionsLoading')}</span>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  )
}
