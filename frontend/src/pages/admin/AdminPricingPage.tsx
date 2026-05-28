import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

import { api } from '../../api/client'
import { AdminCompanySelect } from '../../components/AdminCompanySelect'
import type { Paginated, Project } from '../../api/types'
import { CalculatorConfigEditor } from './CalculatorConfigEditor'
import { useState } from 'react'

type LivePricing = {
  id: string
  company_id: string
  currency: string
  includes_vat: boolean
  calculator_config: Record<string, unknown> | null
  price_rows: Array<{
    id: string
    project_id: string | null
    unit_type_code: string | null
    floor_band: string | null
    price_per_sqm: string | null
    fixed_price: string | null
    conditions: Record<string, unknown> | null
  }>
}

const UNIT_TYPE_OPTIONS = [
  { value: 'SFCA', label: 'SFCA (semi-finished)' },
  { value: 'SFCR', label: 'SFCR (semi-finished)' },
  { value: 'RFCA', label: 'RFCA (regular-finished)' },
  { value: 'RFCR', label: 'RFCR (regular-finished)' },
] as const

export function AdminPricingPage() {
  const qc = useQueryClient()
  const [companyId, setCompanyId] = useState('')
  const [editingRowId, setEditingRowId] = useState<string | null>(null)

  const livePricing = useQuery({
    queryKey: ['admin', 'pricing-live', companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data } = await api.get<LivePricing>('/admin/pricing/live', {
        params: { company_id: companyId },
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

  const actionError = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.detail?.message
      if (typeof message === 'string' && message.trim()) return message
    }
    if (err instanceof Error && err.message.trim()) return err.message
    return fallback
  }

  const addRow = useMutation({
    mutationFn: (body: {
      unit_type_code: string
      floor_band: string
      price_per_sqm: string
      project_id: string
    }) =>
      api.post(
        '/admin/pricing/live/price-rows',
        {
          project_id: body.project_id || undefined,
          unit_type_code: body.unit_type_code || undefined,
          floor_band: body.floor_band || undefined,
          price_per_sqm: body.price_per_sqm,
        },
        { params: { company_id: companyId } },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pricing-live', companyId] })
      qc.invalidateQueries({ queryKey: ['public', 'calculator-config'] })
      toast.success('Price row added.')
    },
    onError: (err) => toast.error(actionError(err, 'Could not add price row.')),
  })

  const deleteRow = useMutation({
    mutationFn: (rowId: string) =>
      api.delete(`/admin/pricing/live/price-rows/${rowId}`, {
        params: { company_id: companyId },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pricing-live', companyId] })
      qc.invalidateQueries({ queryKey: ['public', 'calculator-config'] })
      toast.success('Price row deleted.')
    },
    onError: (err) => toast.error(actionError(err, 'Could not delete price row.')),
  })

  const updateRow = useMutation({
    mutationFn: (body: {
      row_id: string
      unit_type_code: string
      floor_band: string
      price_per_sqm: string
      project_id: string
    }) =>
      api.patch(
        `/admin/pricing/live/price-rows/${body.row_id}`,
        {
          project_id: body.project_id || undefined,
          unit_type_code: body.unit_type_code || undefined,
          floor_band: body.floor_band || undefined,
          price_per_sqm: body.price_per_sqm,
        },
        { params: { company_id: companyId } },
      ),
    onSuccess: () => {
      setEditingRowId(null)
      qc.invalidateQueries({ queryKey: ['admin', 'pricing-live', companyId] })
      qc.invalidateQueries({ queryKey: ['public', 'calculator-config'] })
      toast.success('Price row updated.')
    },
    onError: (err) => toast.error(actionError(err, 'Could not update price row.')),
  })

  return (
    <div className="space-y-8 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Pricing</h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Edit apartment rates and calculator settings for the live site. When Ayat changes prices,
        update the numbers here and save — no drafts or publishing step.
      </p>

      <AdminCompanySelect
        value={companyId}
        onChange={(id) => setCompanyId(id)}
      />

      {companyId && livePricing.isLoading ? (
        <p className="text-sm text-stone-500">Loading pricing…</p>
      ) : null}

      {companyId && livePricing.data ? (
        <div className="space-y-6">
          <p className="text-sm text-brand-700 dark:text-brand-400">
            Live pricing · {livePricing.data.currency}
            {livePricing.data.includes_vat ? ' (includes VAT)' : ''}
          </p>

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
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              Apartment price rows (ETB per m²)
            </h2>
            <p className="text-xs text-stone-500">
              Unit codes: SFCA, SFCR (semi-finished), RFCA, RFCR (regular). Floor band examples:{' '}
              <span className="font-mono">3-10</span>, <span className="font-mono">1-16</span>.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Project
                <select name="project_id" className="input">
                  <option value="">Strategy location only</option>
                  {projects.data?.items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Unit type code
                <select name="unit_type_code" required className="input">
                  {UNIT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Floor band
                <input name="floor_band" required className="input" placeholder="3-10" />
              </label>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Price per sqm (ETB)
                <input name="price_per_sqm" required className="input" placeholder="155342" />
              </label>
            </div>
            <button type="submit" className="btn-secondary" disabled={addRow.isPending}>
              Add row
            </button>
          </form>

          <ul className="space-y-2 text-sm">
            {livePricing.data.price_rows.length === 0 ? (
              <li className="text-stone-500">No apartment rates yet — add at least one row.</li>
            ) : (
              livePricing.data.price_rows.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg bg-stone-100 px-3 py-3 dark:bg-stone-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-100">
                        {r.unit_type_code ?? 'any type'} · floor {r.floor_band ?? 'any'} ·{' '}
                        {r.price_per_sqm
                          ? `${Number(r.price_per_sqm).toLocaleString('en-ET')}/sqm`
                          : r.fixed_price
                            ? `fixed ${Number(r.fixed_price).toLocaleString('en-ET')}`
                            : '-'}
                      </p>
                      <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                        Location: {projects.data?.items.find((p) => p.id === r.project_id)?.name ?? 'Strategy location only'}
                        {typeof r.conditions?.calculator_project_id === 'string'
                          ? ` (${r.conditions.calculator_project_id})`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {editingRowId === r.id ? (
                        <button
                          type="button"
                          className="text-xs text-stone-500 hover:underline"
                          onClick={() => setEditingRowId(null)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-brand-700 hover:underline"
                          onClick={() => setEditingRowId(r.id)}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        disabled={deleteRow.isPending}
                        onClick={() => deleteRow.mutate(r.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {editingRowId === r.id ? (
                    <form
                      className="mt-3 grid gap-2 sm:grid-cols-4"
                      onSubmit={(e) => {
                        e.preventDefault()
                        const fd = new FormData(e.currentTarget)
                        updateRow.mutate({
                          row_id: r.id,
                          project_id: String(fd.get('project_id')),
                          unit_type_code: String(fd.get('unit_type_code')),
                          floor_band: String(fd.get('floor_band')),
                          price_per_sqm: String(fd.get('price_per_sqm')),
                        })
                      }}
                    >
                      <select
                        name="project_id"
                        className="input"
                        defaultValue={r.project_id ?? ''}
                      >
                        <option value="">Strategy location only</option>
                        {projects.data?.items.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <select
                        name="unit_type_code"
                        required
                        className="input"
                        defaultValue={r.unit_type_code ?? 'SFCA'}
                      >
                        {UNIT_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <input
                        name="floor_band"
                        required
                        className="input"
                        defaultValue={r.floor_band ?? ''}
                      />
                      <div className="flex gap-2">
                        <input
                          name="price_per_sqm"
                          required
                          className="input"
                          defaultValue={r.price_per_sqm ?? ''}
                        />
                        <button
                          type="submit"
                          className="btn-secondary whitespace-nowrap"
                          disabled={updateRow.isPending}
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  ) : null}
                </li>
              ))
            )}
          </ul>

          <CalculatorConfigEditor
            companyId={companyId}
            initialConfig={
              (livePricing.data.calculator_config as Parameters<
                typeof CalculatorConfigEditor
              >[0]['initialConfig']) ?? null
            }
          />
        </div>
      ) : companyId && livePricing.isError ? (
        <p className="text-sm text-red-600">Could not load pricing. Try again.</p>
      ) : null}
    </div>
  )
}
