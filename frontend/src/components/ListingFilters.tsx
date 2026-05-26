import * as React from 'react'

import { useTranslation } from '../context/LocaleContext'

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

export function ListingFilters({
  filters,
  total,
  isLoading,
  quickFilters,
  onApply,
  onReset,
}: ListingFiltersProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = React.useState(
    Boolean(filters.city || filters.company_slug || filters.unit_type_code),
  )
  const formRef = React.useRef<HTMLFormElement>(null)

  const countLabel = isLoading
    ? t('filters.loading')
    : `${total} ${total === 1 ? t('filters.property') : t('filters.properties')} ${t('filters.available')}`

  return (
    <div className="surface overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-fg">{t('filters.findHome')}</p>
            <p className="mt-0.5 text-xs text-fg-muted">{countLabel}</p>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
            onClick={onReset}
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
              onClick={() => onApply(values)}
            >
              {label}
            </button>
          ))}
        </div>

        <form
          ref={formRef}
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            onApply({
              city: String(fd.get('city') ?? ''),
              area: String(fd.get('area') ?? ''),
              bedrooms: String(fd.get('bedrooms') ?? ''),
              company_slug: String(fd.get('company_slug') ?? ''),
              unit_type_code: String(fd.get('unit_type_code') ?? ''),
            })
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1 text-xs font-medium text-fg-muted">
              {t('filters.neighborhood')}
              <input
                key={`area-${filters.area}`}
                name="area"
                defaultValue={filters.area}
                className="input"
                placeholder={t('filters.neighborhoodPlaceholder')}
              />
            </label>
            <label className="block w-full text-xs font-medium text-fg-muted sm:w-32">
              {t('filters.bedrooms')}
              <input
                key={`bed-${filters.bedrooms}`}
                name="bedrooms"
                defaultValue={filters.bedrooms}
                className="input"
                placeholder={t('filters.bedroomsPlaceholder')}
                inputMode="numeric"
              />
            </label>
            <button type="submit" className="btn-primary w-full sm:w-auto sm:shrink-0">
              {t('filters.search')}
            </button>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 text-xs font-semibold text-fg-muted hover:text-brand-700 dark:hover:text-brand-300"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? t('filters.hideAdvanced') : t('filters.showAdvanced')}
          </button>

          {expanded ? (
            <div className="grid gap-4 rounded-xl bg-surface-muted p-4 sm:grid-cols-3">
              <label className="block text-xs font-medium text-fg-muted">
                {t('filters.city')}
                <input
                  key={`city-${filters.city}`}
                  name="city"
                  defaultValue={filters.city}
                  className="input"
                  placeholder={t('filters.cityPlaceholder')}
                />
              </label>
              <label className="block text-xs font-medium text-fg-muted">
                {t('filters.developer')}
                <input
                  key={`co-${filters.company_slug}`}
                  name="company_slug"
                  defaultValue={filters.company_slug}
                  className="input"
                  placeholder={t('filters.developerPlaceholder')}
                />
              </label>
              <label className="block text-xs font-medium text-fg-muted">
                {t('filters.unitType')}
                <input
                  key={`ut-${filters.unit_type_code}`}
                  name="unit_type_code"
                  defaultValue={filters.unit_type_code}
                  className="input"
                  placeholder={t('filters.unitTypePlaceholder')}
                />
              </label>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  )
}
