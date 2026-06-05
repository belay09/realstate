import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { api } from '../../api/client'
import type { Project } from '../../api/types'
import {
  duplicateRowPayload,
  findMatchingRow,
  priceRowFingerprint,
  type AdminPriceRow,
  type DuplicateConflictMode,
} from '../../lib/adminPricingDuplicate'

type Props = {
  companyId: string
  allRows: AdminPriceRow[]
  sortedProjects: Project[]
  projectSlugByIdMap: Map<string, string>
  rowCountByProject: Map<string | null, number>
  onSuccess: () => void
}

export function CopyRatesPanel({
  companyId,
  allRows,
  sortedProjects,
  projectSlugByIdMap,
  rowCountByProject,
  onSuccess,
}: Props) {
  const sources = useMemo(
    () =>
      sortedProjects.filter((p) => (rowCountByProject.get(p.id) ?? 0) > 0).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [rowCountByProject, sortedProjects],
  )

  const [sourceProjectId, setSourceProjectId] = useState('')
  const [targetIds, setTargetIds] = useState<string[]>([])
  const [conflictMode, setConflictMode] = useState<DuplicateConflictMode>('skip')
  const [pending, setPending] = useState(false)

  const effectiveSourceId = sourceProjectId || sources[0]?.id || ''
  const sourceRows = useMemo(
    () => allRows.filter((r) => (r.project_id ?? null) === effectiveSourceId),
    [allRows, effectiveSourceId],
  )
  const sourceProject = sortedProjects.find((p) => p.id === effectiveSourceId)
  const targetOptions = sortedProjects.filter((p) => p.id !== effectiveSourceId)

  const preview = useMemo(() => {
    let create = 0
    let replace = 0
    let skip = 0
    for (const targetId of targetIds) {
      for (const row of sourceRows) {
        const fp = priceRowFingerprint(row)
        const existing = findMatchingRow(allRows, targetId, fp)
        if (!existing) create += 1
        else if (conflictMode === 'skip') skip += 1
        else if (conflictMode === 'replace') replace += 1
        else create += 1
      }
    }
    return { create, replace, skip }
  }, [allRows, conflictMode, sourceRows, targetIds])

  if (sources.length === 0) return null

  function toggleTarget(id: string) {
    setTargetIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleCopy() {
    if (!effectiveSourceId || targetIds.length === 0) {
      toast.error('Choose a source location and at least one target.')
      return
    }
    setPending(true)
    let created = 0
    let updated = 0
    let skipped = 0
    try {
      for (const targetId of targetIds) {
        for (const row of sourceRows) {
          const fp = priceRowFingerprint(row)
          const existing = findMatchingRow(allRows, targetId, fp)
          const payload = duplicateRowPayload(row, targetId, projectSlugByIdMap)
          if (existing && conflictMode === 'skip') {
            skipped += 1
            continue
          }
          if (existing && conflictMode === 'replace') {
            await api.patch(`/admin/pricing/live/price-rows/${existing.id}`, payload, {
              params: { company_id: companyId },
            })
            updated += 1
            continue
          }
          await api.post('/admin/pricing/live/price-rows', payload, {
            params: { company_id: companyId },
          })
          created += 1
        }
      }
      toast.success(
        `Copied ${sourceRows.length} rate(s) from ${sourceProject?.name ?? 'source'} to ${targetIds.length} location(s).`,
      )
      setTargetIds([])
      onSuccess()
    } catch {
      toast.error('Copy failed. Refresh the page and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="rounded-xl border-2 border-brand-300/80 bg-brand-50/70 p-4 dark:border-brand-700/60 dark:bg-brand-950/30">
      <h2 className="text-sm font-bold text-brand-900 dark:text-brand-100">
        Copy apartment rates to another location
      </h2>
      <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
        Reuse the same unit types, floor bands, and ETB/m² on other projects — no need to retype each
        row.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
          Copy from
          <select
            className="input mt-1"
            value={effectiveSourceId}
            onChange={(e) => {
              setSourceProjectId(e.target.value)
              setTargetIds([])
            }}
          >
            {sources.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({rowCountByProject.get(p.id)} rates)
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-xs font-medium text-stone-700 dark:text-stone-300">Copy to</p>
          <div className="mt-1 max-h-32 space-y-1.5 overflow-y-auto rounded-lg border border-stone-200 bg-white p-2 dark:border-stone-700 dark:bg-stone-950">
            {targetOptions.length === 0 ? (
              <p className="text-xs text-stone-500">Add another project under Admin → Projects first.</p>
            ) : (
              targetOptions.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={targetIds.includes(p.id)}
                    onChange={() => toggleTarget(p.id)}
                  />
                  {p.name}
                  {(rowCountByProject.get(p.id) ?? 0) > 0 ? (
                    <span className="text-xs text-stone-400">
                      ({rowCountByProject.get(p.id)} existing)
                    </span>
                  ) : null}
                </label>
              ))
            )}
          </div>
          {targetOptions.length > 1 ? (
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                className="text-xs text-brand-700 hover:underline dark:text-brand-400"
                onClick={() => setTargetIds(targetOptions.map((p) => p.id))}
              >
                Select all
              </button>
              <button
                type="button"
                className="text-xs text-stone-500 hover:underline"
                onClick={() => setTargetIds([])}
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-stone-600 dark:text-stone-400">
        <span className="font-medium">If target already has same rate:</span>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="copy-conflict-inline"
            checked={conflictMode === 'skip'}
            onChange={() => setConflictMode('skip')}
          />
          Skip
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="copy-conflict-inline"
            checked={conflictMode === 'replace'}
            onChange={() => setConflictMode('replace')}
          />
          Replace
        </label>
      </div>

      {targetIds.length > 0 ? (
        <p className="mt-2 text-xs text-brand-800 dark:text-brand-200">
          Will copy {sourceRows.length} rate(s): {preview.create} new
          {preview.replace ? `, ${preview.replace} updated` : ''}
          {preview.skip ? `, ${preview.skip} skipped` : ''}
        </p>
      ) : null}

      <button
        type="button"
        className="btn-primary mt-4"
        disabled={pending || targetIds.length === 0 || sourceRows.length === 0}
        onClick={() => void handleCopy()}
      >
        {pending ? 'Copying…' : 'Copy rates'}
      </button>
    </section>
  )
}
