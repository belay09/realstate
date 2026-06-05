import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { api } from '../../api/client'
import { AdminCompanySelect } from '../../components/AdminCompanySelect'
import type { Paginated, Project } from '../../api/types'
import {
  buildPriceRowPayload,
  CMC_CONSTRUCTION_OPTIONS,
  constructionStageFromRow,
  constructionStageLabel,
  isCmcInventoryProject,
  projectSlugById,
} from '../../lib/adminPricingCompletion'
import { DuplicatePricingModal } from '../../components/admin/DuplicatePricingModal'
import type { AdminPriceRow } from '../../lib/adminPricingDuplicate'
import { CalculatorConfigEditor } from './CalculatorConfigEditor'

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

const STRATEGY_FILTER = '__strategy__'
const ALL_LOCATIONS_FILTER = 'all'

type PriceRow = LivePricing['price_rows'][number]

function projectLabel(
  projectId: string | null,
  projectNameById: Map<string, string>,
): string {
  if (!projectId) return 'Strategy location only'
  return projectNameById.get(projectId) ?? 'Unknown project'
}

function PriceRowEditForm({
  row,
  sortedProjects,
  projectSlugByIdMap,
  defaultConstructionStage,
  onSave,
  onCancel,
  pending,
}: {
  row: PriceRow
  sortedProjects: Project[]
  projectSlugByIdMap: Map<string, string>
  defaultConstructionStage: string
  onSave: (fields: {
    project_id: string
    unit_type_code: string
    floor_band: string
    price_per_sqm: string
    construction_stage?: string
  }) => void
  onCancel: () => void
  pending: boolean
}) {
  const [editProjectId, setEditProjectId] = useState(row.project_id ?? '')

  return (
    <form
      className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        onSave({
          project_id: String(fd.get('project_id')),
          construction_stage: String(fd.get('construction_stage') || 'both'),
          unit_type_code: String(fd.get('unit_type_code')),
          floor_band: String(fd.get('floor_band')),
          price_per_sqm: String(fd.get('price_per_sqm')),
        })
      }}
    >
      <select
        name="project_id"
        className="input"
        defaultValue={row.project_id ?? ''}
        onChange={(e) => setEditProjectId(e.target.value)}
      >
        <option value="">Strategy location only</option>
        {sortedProjects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {isCmcInventoryProject(editProjectId, projectSlugByIdMap) ? (
        <select
          name="construction_stage"
          className="input"
          defaultValue={defaultConstructionStage}
        >
          {CMC_CONSTRUCTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : null}
      <select name="unit_type_code" required className="input" defaultValue={row.unit_type_code ?? 'SFCA'}>
        {UNIT_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <input name="floor_band" required className="input" defaultValue={row.floor_band ?? ''} />
      <input name="price_per_sqm" required className="input" defaultValue={row.price_per_sqm ?? ''} />
      <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
        <button type="submit" className="btn-secondary whitespace-nowrap" disabled={pending}>
          Save
        </button>
        <button type="button" className="text-xs text-stone-500 hover:underline" onClick={onCancel}>
          Cancel edit
        </button>
      </div>
    </form>
  )
}

function groupRowsByProject(
  rows: PriceRow[],
  projectNameById: Map<string, string>,
): Array<{ projectId: string | null; label: string; rows: PriceRow[] }> {
  const byProject = new Map<string | null, PriceRow[]>()
  for (const row of rows) {
    const key = row.project_id ?? null
    const list = byProject.get(key)
    if (list) list.push(row)
    else byProject.set(key, [row])
  }
  return Array.from(byProject.entries())
    .map(([projectId, groupRows]) => ({
      projectId,
      label: projectLabel(projectId, projectNameById),
      rows: groupRows,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
}

export function AdminPricingPage() {
  const qc = useQueryClient()
  const [companyId, setCompanyId] = useState('')
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [locationFilter, setLocationFilter] = useState(ALL_LOCATIONS_FILTER)
  const [addProjectId, setAddProjectId] = useState('')
  const [duplicateState, setDuplicateState] = useState<{
    sourceLabel: string
    sourceProjectId: string | null
    rows: AdminPriceRow[]
  } | null>(null)

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

  const projectSlugByIdMap = useMemo(
    () => projectSlugById(projects.data?.items ?? []),
    [projects.data?.items],
  )

  const addRow = useMutation({
    mutationFn: (body: {
      unit_type_code: string
      floor_band: string
      price_per_sqm: string
      project_id: string
      construction_stage?: string
    }) => {
      const payload = buildPriceRowPayload(body, projectSlugByIdMap)
      return api.post('/admin/pricing/live/price-rows', payload, {
        params: { company_id: companyId },
      })
    },
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
      construction_stage?: string
    }) => {
      const payload = buildPriceRowPayload(body, projectSlugByIdMap)
      return api.patch(`/admin/pricing/live/price-rows/${body.row_id}`, payload, {
        params: { company_id: companyId },
      })
    },
    onSuccess: () => {
      setEditingRowId(null)
      qc.invalidateQueries({ queryKey: ['admin', 'pricing-live', companyId] })
      qc.invalidateQueries({ queryKey: ['public', 'calculator-config'] })
      toast.success('Price row updated.')
    },
    onError: (err) => toast.error(actionError(err, 'Could not update price row.')),
  })

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of projects.data?.items ?? []) {
      map.set(p.id, p.name)
    }
    return map
  }, [projects.data?.items])

  const sortedProjects = useMemo(
    () =>
      [...(projects.data?.items ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [projects.data?.items],
  )

  const rowCountByProject = useMemo(() => {
    const counts = new Map<string | null, number>()
    for (const row of livePricing.data?.price_rows ?? []) {
      const key = row.project_id ?? null
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
  }, [livePricing.data?.price_rows])

  const filteredRows = useMemo(() => {
    const rows = livePricing.data?.price_rows ?? []
    if (locationFilter === ALL_LOCATIONS_FILTER) return rows
    if (locationFilter === STRATEGY_FILTER) return rows.filter((r) => !r.project_id)
    return rows.filter((r) => r.project_id === locationFilter)
  }, [livePricing.data?.price_rows, locationFilter])

  const groupedRows = useMemo(
    () => groupRowsByProject(filteredRows, projectNameById),
    [filteredRows, projectNameById],
  )

  const addFormDefaultProjectId =
    locationFilter !== ALL_LOCATIONS_FILTER && locationFilter !== STRATEGY_FILTER
      ? locationFilter
      : ''

  return (
    <div className="space-y-8 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Pricing</h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Edit apartment rates and calculator settings for the live site. Use{' '}
        <strong>Copy to…</strong> or <strong>Copy all to other locations</strong> to reuse the same
        rates on another project without retyping. When Ayat changes prices, update here — no drafts
        or publishing step.
      </p>

      <AdminCompanySelect
        value={companyId}
        onChange={(id) => {
          setCompanyId(id)
          setLocationFilter(ALL_LOCATIONS_FILTER)
          setEditingRowId(null)
        }}
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
                construction_stage: String(fd.get('construction_stage') || 'both'),
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
              For <strong>CMC</strong>, use <em>Construction stage</em> for not started vs near
              completion. Cover every floor band you need (e.g. add <span className="font-mono">SFCA
              11-18</span> if floors 11–18 are missing between 3–10 and 19–26). Use{' '}
              <span className="font-mono">SFCR</span> for 3-bedroom semi-finished, or{' '}
              <span className="font-mono">SFCA</span> if you use one rate for all semi-finished beds.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Project
                <select
                  name="project_id"
                  className="input"
                  key={addFormDefaultProjectId}
                  defaultValue={addFormDefaultProjectId}
                  onChange={(e) => setAddProjectId(e.target.value)}
                >
                  <option value="">Strategy location only</option>
                  {sortedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              {isCmcInventoryProject(addProjectId || addFormDefaultProjectId, projectSlugByIdMap) ? (
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 sm:col-span-2">
                  Construction stage (CMC calculator)
                  <select name="construction_stage" className="input" defaultValue="both">
                    {CMC_CONSTRUCTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              Filter by location
              <select
                className="input mt-1 min-w-[14rem]"
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value)
                  setEditingRowId(null)
                }}
              >
                <option value={ALL_LOCATIONS_FILTER}>
                  All locations ({livePricing.data.price_rows.length})
                </option>
                {(rowCountByProject.get(null) ?? 0) > 0 ? (
                  <option value={STRATEGY_FILTER}>
                    Strategy location only ({rowCountByProject.get(null)})
                  </option>
                ) : null}
                {sortedProjects.map((p) => {
                  const count = rowCountByProject.get(p.id) ?? 0
                  if (count === 0) return null
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({count})
                    </option>
                  )
                })}
              </select>
            </label>
            {locationFilter !== ALL_LOCATIONS_FILTER ? (
              <button
                type="button"
                className="text-xs text-brand-700 hover:underline sm:mb-2"
                onClick={() => setLocationFilter(ALL_LOCATIONS_FILTER)}
              >
                Show all locations
              </button>
            ) : null}
          </div>

          {livePricing.data.price_rows.length === 0 ? (
            <p className="text-sm text-stone-500">No apartment rates yet — add at least one row.</p>
          ) : filteredRows.length === 0 ? (
            <p className="text-sm text-stone-500">No rates for this location.</p>
          ) : (
            <div className="space-y-8">
              {groupedRows.map((group) => (
                <section key={group.projectId ?? STRATEGY_FILTER}>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-stone-200 pb-2 dark:border-stone-700">
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {group.label}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs text-stone-500">
                        {group.rows.length} {group.rows.length === 1 ? 'rate' : 'rates'}
                      </span>
                      {group.projectId ? (
                        <button
                          type="button"
                          className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-400"
                          onClick={() =>
                            setDuplicateState({
                              sourceLabel: group.label,
                              sourceProjectId: group.projectId,
                              rows: group.rows,
                            })
                          }
                        >
                          Copy all to other locations…
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {group.rows.map((r) => (
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
                            {constructionStageLabel(
                              constructionStageFromRow(r, projectSlugByIdMap),
                            ) ? (
                              <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                                Construction stage:{' '}
                                {constructionStageLabel(
                                  constructionStageFromRow(r, projectSlugByIdMap),
                                )}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
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
                            {r.project_id ? (
                              <button
                                type="button"
                                className="text-xs text-stone-600 hover:underline dark:text-stone-400"
                                onClick={() =>
                                  setDuplicateState({
                                    sourceLabel: `${group.label} · ${r.unit_type_code} ${r.floor_band}`,
                                    sourceProjectId: r.project_id,
                                    rows: [r],
                                  })
                                }
                              >
                                Copy to…
                              </button>
                            ) : null}
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
                          <PriceRowEditForm
                            row={r}
                            sortedProjects={sortedProjects}
                            projectSlugByIdMap={projectSlugByIdMap}
                            defaultConstructionStage={
                              constructionStageFromRow(r, projectSlugByIdMap) ?? 'both'
                            }
                            onSave={(fields) => updateRow.mutate({ row_id: r.id, ...fields })}
                            onCancel={() => setEditingRowId(null)}
                            pending={updateRow.isPending}
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

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

      {duplicateState && companyId && livePricing.data ? (
        <DuplicatePricingModal
          companyId={companyId}
          sourceLabel={duplicateState.sourceLabel}
          sourceProjectId={duplicateState.sourceProjectId}
          rows={duplicateState.rows}
          allRows={livePricing.data.price_rows}
          sortedProjects={sortedProjects}
          projectSlugByIdMap={projectSlugByIdMap}
          onClose={() => setDuplicateState(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['admin', 'pricing-live', companyId] })
            qc.invalidateQueries({ queryKey: ['public', 'calculator-config'] })
          }}
        />
      ) : null}
    </div>
  )
}
