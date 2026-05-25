import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../api/client'
import type { Paginated, PublicListingSummary } from '../api/types'
import { usePageTitle } from '../hooks/usePageTitle'

type Filters = {
  city: string
  area: string
  bedrooms: string
  company_slug: string
  unit_type_code: string
}

const emptyFilters: Filters = {
  city: '',
  area: '',
  bedrooms: '',
  company_slug: '',
  unit_type_code: '',
}

export function ListingsPage() {
  usePageTitle('Listings')
  const [filters, setFilters] = React.useState<Filters>(emptyFilters)

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

  return (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Property listings
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Showing published, available units only ({query.data?.total ?? '…'} total).
        </p>
      </div>

      <form
        className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3 dark:border-stone-800 dark:bg-stone-950"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          setFilters({
            city: String(fd.get('city') ?? ''),
            area: String(fd.get('area') ?? ''),
            bedrooms: String(fd.get('bedrooms') ?? ''),
            company_slug: String(fd.get('company_slug') ?? ''),
            unit_type_code: String(fd.get('unit_type_code') ?? ''),
          })
        }}
      >
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          City (contains)
          <input name="city" defaultValue={filters.city} className="input" placeholder="Addis" />
        </label>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Area (contains)
          <input name="area" defaultValue={filters.area} className="input" placeholder="Ayat" />
        </label>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Bedrooms
          <input name="bedrooms" defaultValue={filters.bedrooms} className="input" placeholder="3" />
        </label>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Company slug
          <input name="company_slug" defaultValue={filters.company_slug} className="input" />
        </label>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Unit type code
          <input name="unit_type_code" defaultValue={filters.unit_type_code} className="input" />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <button type="submit" className="btn-primary">
            Apply filters
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setFilters(emptyFilters)
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {query.isLoading && <p className="text-sm text-stone-500">Loading…</p>}
      {query.isError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Could not load listings. Is the API running at{' '}
          <code className="rounded bg-red-100 px-1 dark:bg-red-900">
            {import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'}
          </code>
          ? If the API is up but this persists, restart Docker after a CORS update, or check the
          browser console for a blocked cross-origin request (Vite often uses port 5174).
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {query.data?.items.map((item) => (
          <li key={item.id}>
            <Link
              to={`/listings/${item.slug}`}
              className="block h-full rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-950 dark:hover:border-emerald-800"
            >
              {item.primary_image_url ? (
                <img
                  src={item.primary_image_url}
                  alt=""
                  className="mb-3 h-36 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="mb-3 flex h-36 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-500 dark:bg-stone-900 dark:text-stone-500">
                  No photo
                </div>
              )}
              <h2 className="font-semibold text-stone-900 dark:text-stone-50">{item.title}</h2>
              <p className="mt-1 text-xs text-stone-500">
                {item.company_name} · {item.project_name}
              </p>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                {[item.city, item.area].filter(Boolean).join(' · ') || 'Location TBC'}
                {item.bedrooms != null ? ` · ${item.bedrooms} bed` : ''}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {query.data && query.data.items.length === 0 && !query.isLoading && (
        <p className="text-sm text-stone-500">No listings match these filters yet.</p>
      )}
    </div>
  )
}
