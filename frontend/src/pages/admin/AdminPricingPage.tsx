import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { api } from '../../api/client'
import { AdminCompanySelect } from '../../components/AdminCompanySelect'
import type { Paginated, Project } from '../../api/types'

type PricingVersion = {
  id: string
  company_id: string
  name: string
  status: string
  effective_from: string
  effective_to: string | null
  currency: string
  includes_vat: boolean
}

type PriceRow = {
  id: string
  unit_type_code: string | null
  floor_band: string | null
  price_per_sqm: string | null
  fixed_price: string | null
}

export function AdminPricingPage() {
  const qc = useQueryClient()
  const [companyId, setCompanyId] = useState('')
  const [selectedVersionId, setSelectedVersionId] = useState('')

  const versions = useQuery({
    queryKey: ['admin', 'pricing-versions', companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<PricingVersion>>('/admin/pricing-versions', {
        params: { company_id: companyId, limit: 50 },
      })
      return data
    },
  })

  const projects = useQuery({
    queryKey: ['admin', 'projects', companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<Project>>('/admin/projects', {
        params: { company_id: companyId, limit: 100 },
      })
      return data
    },
  })

  const rows = useQuery({
    queryKey: ['admin', 'price-rows', selectedVersionId],
    enabled: Boolean(selectedVersionId),
    queryFn: async () => {
      const { data } = await api.get<PriceRow[]>(
        `/admin/pricing-versions/${selectedVersionId}/price-rows`,
      )
      return data
    },
  })

  const createVersion = useMutation({
    mutationFn: (body: {
      name: string
      effective_from: string
      currency: string
    }) =>
      api.post('/admin/pricing-versions', {
        company_id: companyId,
        name: body.name,
        effective_from: body.effective_from,
        currency: body.currency,
        includes_vat: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pricing-versions', companyId] })
    },
  })

  const publishVersion = useMutation({
    mutationFn: (versionId: string) => api.post(`/admin/pricing-versions/${versionId}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pricing-versions', companyId] })
      qc.invalidateQueries({ queryKey: ['admin', 'price-rows', selectedVersionId] })
    },
  })

  const addRow = useMutation({
    mutationFn: (body: {
      unit_type_code: string
      floor_band: string
      price_per_sqm: string
      project_id: string
    }) =>
      api.post(`/admin/pricing-versions/${selectedVersionId}/price-rows`, {
        project_id: body.project_id || undefined,
        unit_type_code: body.unit_type_code || undefined,
        floor_band: body.floor_band || undefined,
        price_per_sqm: body.price_per_sqm,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'price-rows', selectedVersionId] }),
  })

  const selectedVersion = versions.data?.items.find((v) => v.id === selectedVersionId)

  return (
    <div className="space-y-8 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Pricing</h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Create draft pricing versions, add price rows, then publish. Published pricing powers public
        price preview and quotes.
      </p>

      <AdminCompanySelect value={companyId} onChange={(id) => {
        setCompanyId(id)
        setSelectedVersionId('')
      }} />

      {companyId ? (
        <form
          className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            createVersion.mutate({
              name: String(fd.get('name')),
              effective_from: String(fd.get('effective_from')),
              currency: String(fd.get('currency') ?? 'ETB'),
            })
            e.currentTarget.reset()
          }}
        >
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">New pricing version (draft)</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              Name
              <input name="name" required className="input" placeholder="Ayat pricing 2026" />
            </label>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              Effective from
              <input name="effective_from" type="date" required className="input" />
            </label>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              Currency
              <input name="currency" defaultValue="ETB" className="input" />
            </label>
          </div>
          <button type="submit" className="btn-primary" disabled={createVersion.isPending}>
            Create draft version
          </button>
        </form>
      ) : null}

      {versions.data && versions.data.items.length > 0 ? (
        <div className="space-y-4">
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Pricing version
            <select
              className="input mt-1 max-w-lg"
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
            >
              <option value="">Select version…</option>
              {versions.data.items.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.status}) · from {v.effective_from}
                </option>
              ))}
            </select>
          </label>

          {selectedVersion?.status === 'draft' ? (
            <button
              type="button"
              className="btn-primary"
              disabled={publishVersion.isPending || !rows.data?.length}
              onClick={() => publishVersion.mutate(selectedVersionId)}
            >
              Publish version (requires at least one price row)
            </button>
          ) : selectedVersion?.status === 'published' ? (
            <p className="text-sm text-brand-700 dark:text-brand-400">This version is published and active by date.</p>
          ) : null}

          {selectedVersionId && selectedVersion?.status === 'draft' ? (
            <form
              className="space-y-3 rounded-xl border border-dashed border-stone-300 p-4 dark:border-stone-700"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                addRow.mutate({
                  project_id: String(fd.get('project_id')),
                  unit_type_code: String(fd.get('unit_type_code')),
                  floor_band: String(fd.get('floor_band')),
                  price_per_sqm: String(fd.get('price_per_sqm')),
                })
                e.currentTarget.reset()
              }}
            >
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Add price row</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                  Project
                  <select name="project_id" className="input">
                    <option value="">Any project</option>
                    {projects.data?.items.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                  Unit type code
                  <input name="unit_type_code" className="input" placeholder="3br" />
                </label>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                  Floor band
                  <input name="floor_band" className="input" placeholder="5-10" />
                </label>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                  Price per sqm (ETB)
                  <input name="price_per_sqm" required className="input" placeholder="85000" />
                </label>
              </div>
              <button type="submit" className="btn-secondary" disabled={addRow.isPending}>
                Add row
              </button>
            </form>
          ) : null}

          <ul className="space-y-2 text-sm">
            {rows.data?.map((r) => (
              <li key={r.id} className="rounded-lg bg-stone-100 px-3 py-2 dark:bg-stone-900">
                {r.unit_type_code ?? 'any type'} · floor {r.floor_band ?? 'any'} ·{' '}
                {r.price_per_sqm ? `${r.price_per_sqm}/sqm` : r.fixed_price ? `fixed ${r.fixed_price}` : '-'}
              </li>
            ))}
          </ul>
        </div>
      ) : companyId ? (
        <p className="text-sm text-stone-500">No pricing versions yet for this company.</p>
      ) : null}
    </div>
  )
}
