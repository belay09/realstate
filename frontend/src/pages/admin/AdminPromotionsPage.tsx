import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { api } from '../../api/client'
import { AdminCompanySelect } from '../../components/AdminCompanySelect'
import type { AdminLocationContent, Company, Paginated } from '../../api/types'
import { AYAT_PARTNER } from '../../content/partners'
import { useCalculatorConfig } from '../../hooks/useCalculatorConfig'
import { AYAT_DEVELOPMENT_ZONES } from '../../lib/listingDisplay'
import { shopLocationsFromConfig } from '../../lib/shopLocations'

type LocationPromotion = {
  id: string
  company_id: string
  name: string
  kind: 'apartment' | 'shop'
  location_ids: string[]
  discount_percent: string
  starts_at: string
  ends_at: string
  is_active: boolean
}

/** Admin API serializes LocationPromotionRead with camelCase aliases. */
function normalizePromotion(raw: Record<string, unknown>): LocationPromotion {
  const locationIds = raw.locationIds ?? raw.location_ids
  return {
    id: String(raw.id),
    company_id: String(raw.companyId ?? raw.company_id),
    name: String(raw.name),
    kind: raw.kind as LocationPromotion['kind'],
    location_ids: Array.isArray(locationIds) ? locationIds.map(String) : [],
    discount_percent: String(raw.discountPercent ?? raw.discount_percent),
    starts_at: String(raw.startsAt ?? raw.starts_at),
    ends_at: String(raw.endsAt ?? raw.ends_at),
    is_active: Boolean(raw.isActive ?? raw.is_active),
  }
}

type FormState = {
  name: string
  kind: 'apartment' | 'shop'
  discount_percent: string
  starts_at: string
  ends_at: string
  location_ids: string[]
  is_active: boolean
}

const emptyForm = (): FormState => ({
  name: '',
  kind: 'apartment',
  discount_percent: '5',
  starts_at: '',
  ends_at: '',
  location_ids: [],
  is_active: true,
})

function toLocalInputValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localInputToIso(value: string): string {
  return new Date(value).toISOString()
}

function actionError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (detail && typeof detail === 'object' && 'message' in detail) {
      return String((detail as { message: string }).message)
    }
  }
  return fallback
}

function promotionStatus(p: LocationPromotion): 'active' | 'scheduled' | 'expired' | 'off' {
  if (!p.is_active) return 'off'
  const now = Date.now()
  const start = new Date(p.starts_at).getTime()
  const end = new Date(p.ends_at).getTime()
  if (now < start) return 'scheduled'
  if (now > end) return 'expired'
  return 'active'
}

export function AdminPromotionsPage() {
  const qc = useQueryClient()
  const [companyId, setCompanyId] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { data: calculatorConfig } = useCalculatorConfig()

  const companies = useQuery({
    queryKey: ['admin', 'companies', 'promotions'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Company>>('/admin/companies', { params: { limit: 100 } })
      return data
    },
  })

  useEffect(() => {
    if (companyId || !companies.data?.items.length) return
    const ayat = companies.data.items.find((c) => c.slug === AYAT_PARTNER.slug)
    setCompanyId(ayat?.id ?? companies.data.items[0].id)
  }, [companyId, companies.data?.items])

  useEffect(() => {
    if (!form.starts_at) {
      const start = new Date()
      const end = new Date(start)
      end.setMonth(end.getMonth() + 1)
      setForm((f) => ({
        ...f,
        starts_at: toLocalInputValue(start.toISOString()),
        ends_at: toLocalInputValue(end.toISOString()),
      }))
    }
  }, [form.starts_at])

  const locationContent = useQuery({
    queryKey: ['admin', 'location-content', 'promotions'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AdminLocationContent>>('/admin/location-content', {
        params: { limit: 200 },
      })
      return data
    },
  })

  const promotions = useQuery({
    queryKey: ['admin', 'location-promotions', companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data } = await api.get<Record<string, unknown>[]>('/admin/location-promotions', {
        params: { company_id: companyId },
      })
      return data.map(normalizePromotion)
    },
  })

  const locationOptions = useMemo(() => {
    const items = locationContent.data?.items ?? []
    if (form.kind === 'apartment') {
      const seen = new Set<string>()
      const out: { id: string; label: string }[] = []
      for (const row of items) {
        if (row.kind !== 'apartment') continue
        seen.add(row.location_id)
        out.push({ id: row.location_id, label: row.title })
      }
      for (const [slug, label] of Object.entries(AYAT_DEVELOPMENT_ZONES)) {
        if (seen.has(slug)) continue
        seen.add(slug)
        out.push({ id: slug, label })
      }
      return out.sort((a, b) => a.label.localeCompare(b.label))
    }
    const seen = new Set<string>()
    const out: { id: string; label: string }[] = []
    for (const row of items) {
      if (row.kind !== 'shop') continue
      seen.add(row.location_id)
      out.push({ id: row.location_id, label: row.title })
    }
    for (const z of shopLocationsFromConfig(calculatorConfig)) {
      if (seen.has(z.id)) continue
      seen.add(z.id)
      out.push({ id: z.id, label: z.id })
    }
    return out.sort((a, b) => a.label.localeCompare(b.label))
  }, [form.kind, locationContent.data?.items, calculatorConfig])

  const savePromotion = useMutation({
    mutationFn: async () => {
      const body = {
        company_id: companyId,
        name: form.name.trim(),
        kind: form.kind,
        location_ids: form.location_ids,
        discount_percent: Number(form.discount_percent),
        starts_at: localInputToIso(form.starts_at),
        ends_at: localInputToIso(form.ends_at),
        is_active: form.is_active,
      }
      if (editingId) {
        const { company_id: _cid, ...patch } = body
        await api.patch(`/admin/location-promotions/${editingId}`, patch)
      } else {
        await api.post('/admin/location-promotions', body)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'location-promotions', companyId] })
      qc.invalidateQueries({ queryKey: ['public', 'calculator-config'] })
      toast.success(editingId ? 'Promotion updated.' : 'Promotion created.')
      setEditingId(null)
      setForm(emptyForm())
    },
    onError: (err) => toast.error(actionError(err, 'Could not save promotion.')),
  })

  const deletePromotion = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/location-promotions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'location-promotions', companyId] })
      qc.invalidateQueries({ queryKey: ['public', 'calculator-config'] })
      toast.success('Promotion deleted.')
    },
    onError: (err) => toast.error(actionError(err, 'Could not delete promotion.')),
  })

  function startEdit(row: LocationPromotion) {
    setEditingId(row.id)
    setForm({
      name: row.name,
      kind: row.kind,
      discount_percent: String(Number(row.discount_percent)),
      starts_at: toLocalInputValue(row.starts_at),
      ends_at: toLocalInputValue(row.ends_at),
      location_ids: [...row.location_ids],
      is_active: row.is_active,
    })
  }

  function toggleLocation(id: string) {
    setForm((f) => {
      const has = f.location_ids.includes(id)
      return {
        ...f,
        location_ids: has ? f.location_ids.filter((x) => x !== id) : [...f.location_ids, id],
      }
    })
  }

  function selectAllLocations() {
    setForm((f) => ({ ...f, location_ids: locationOptions.map((loc) => loc.id) }))
  }

  function clearLocations() {
    setForm((f) => ({ ...f, location_ids: [] }))
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Location promotions</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Limited-time <strong>extra</strong> discount (%) for specific apartment or shop locations.
          Visitors see it on the price calculator after the normal Ayat down-payment discount.
        </p>
      </div>

      <ol className="list-decimal space-y-2 rounded-xl border border-brand-200/80 bg-brand-50/60 p-4 pl-8 text-sm text-stone-700 dark:border-brand-800/50 dark:bg-brand-950/30 dark:text-stone-300">
        <li>
          Open <strong className="text-stone-900 dark:text-stone-100">Location pages</strong> first and
          make sure each location you want is <strong>Active</strong> (apartment or shop).
        </li>
        <li>
          Here, pick <strong>Apartments</strong> or <strong>Shops</strong>, set the extra % and dates,
          then tick which locations get the offer.
        </li>
        <li>
          Click <strong>Create promotion</strong>. Test on the public{' '}
          <a href="/calculator" className="font-medium text-brand-700 underline dark:text-brand-400">
            calculator
          </a>{' '}
          or a location page — look for the amber &quot;Special offer&quot; line.
        </li>
      </ol>

      <AdminCompanySelect value={companyId} onChange={setCompanyId} />

      {!companyId ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          Select a company above to create promotions.
        </p>
      ) : null}

      {companyId ? (
        <>
          <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              {editingId ? 'Edit promotion' : 'New promotion'}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Name (shown on calculator)
                <input
                  className="input mt-1 w-full"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. CMC spring offer"
                />
              </label>
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Property type
                <select
                  className="input mt-1 w-full"
                  value={form.kind}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      kind: e.target.value as FormState['kind'],
                      location_ids: [],
                    }))
                  }
                >
                  <option value="apartment">Apartments</option>
                  <option value="shop">Shops</option>
                </select>
              </label>
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Extra discount (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  className="input mt-1 w-full"
                  value={form.discount_percent}
                  onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))}
                />
              </label>
              <label className="flex items-center gap-2 self-end text-xs font-medium text-stone-600 dark:text-stone-400">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Active
              </label>
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Starts
                <input
                  type="datetime-local"
                  className="input mt-1 w-full"
                  value={form.starts_at}
                  onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                />
              </label>
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Ends
                <input
                  type="datetime-local"
                  className="input mt-1 w-full"
                  value={form.ends_at}
                  onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                />
              </label>
            </div>

            <div className="mt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
                  Locations — tick every place that gets this offer ({form.location_ids.length}{' '}
                  selected)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-400"
                    onClick={selectAllLocations}
                    disabled={locationOptions.length === 0}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="text-xs text-stone-500 hover:underline"
                    onClick={clearLocations}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                Slug must match Location pages (e.g. <span className="font-mono">cmc-extension</span>{' '}
                for apartments, <span className="font-mono">cmc-extension-shop</span> for shops).
              </p>
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-stone-200 p-2 dark:border-stone-700">
                {locationOptions.length === 0 ? (
                  <p className="text-xs text-stone-500">No locations for this type yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {locationOptions.map((loc) => (
                      <li key={loc.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-stone-50 dark:hover:bg-stone-900">
                          <input
                            type="checkbox"
                            checked={form.location_ids.includes(loc.id)}
                            onChange={() => toggleLocation(loc.id)}
                          />
                          <span className="font-mono text-xs text-stone-500">{loc.id}</span>
                          <span>{loc.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                disabled={
                  savePromotion.isPending ||
                  !form.name.trim() ||
                  form.location_ids.length === 0 ||
                  !form.starts_at ||
                  !form.ends_at
                }
                onClick={() => savePromotion.mutate()}
              >
                {savePromotion.isPending ? 'Saving…' : editingId ? 'Update promotion' : 'Create promotion'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingId(null)
                    setForm(emptyForm())
                  }}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-stone-200 dark:border-stone-800">
            <h2 className="border-b border-stone-200 px-4 py-3 text-sm font-semibold dark:border-stone-800">
              Existing promotions
            </h2>
            {promotions.isLoading ? (
              <p className="p-4 text-sm text-stone-500">Loading…</p>
            ) : (promotions.data?.length ?? 0) === 0 ? (
              <p className="p-4 text-sm text-stone-500">No promotions yet.</p>
            ) : (
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {promotions.data?.map((row) => {
                  const status = promotionStatus(row)
                  return (
                    <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-semibold text-stone-900 dark:text-stone-100">{row.name}</p>
                        <p className="text-xs text-stone-500">
                          {row.kind} · {Number(row.discount_percent)}% ·{' '}
                          <span
                            className={
                              status === 'active'
                                ? 'text-emerald-600'
                                : status === 'scheduled'
                                  ? 'text-amber-600'
                                  : 'text-stone-400'
                            }
                          >
                            {status}
                          </span>
                        </p>
                        <p className="mt-1 font-mono text-xs text-stone-500">
                          {row.location_ids.length > 0
                            ? row.location_ids.join(', ')
                            : '—'}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {new Date(row.starts_at).toLocaleString()} →{' '}
                          {new Date(row.ends_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-xs text-brand-700 hover:underline dark:text-brand-400"
                          onClick={() => startEdit(row)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline"
                          disabled={deletePromotion.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete promotion "${row.name}"?`)) {
                              deletePromotion.mutate(row.id)
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
