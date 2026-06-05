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
  sourceLabel: string
  sourceProjectId: string | null
  rows: AdminPriceRow[]
  allRows: AdminPriceRow[]
  sortedProjects: Project[]
  projectSlugByIdMap: Map<string, string>
  onClose: () => void
  onSuccess: () => void
}

export function DuplicatePricingModal({
  companyId,
  sourceLabel,
  sourceProjectId,
  rows,
  allRows,
  sortedProjects,
  projectSlugByIdMap,
  onClose,
  onSuccess,
}: Props) {
  const [targetIds, setTargetIds] = useState<string[]>([])
  const [conflictMode, setConflictMode] = useState<DuplicateConflictMode>('skip')
  const [pending, setPending] = useState(false)

  const targetOptions = useMemo(
    () => sortedProjects.filter((p) => p.id !== (sourceProjectId ?? '')),
    [sortedProjects, sourceProjectId],
  )

  const preview = useMemo(() => {
    let create = 0
    let replace = 0
    let skip = 0
    for (const targetId of targetIds) {
      for (const row of rows) {
        const fp = priceRowFingerprint(row)
        const existing = findMatchingRow(allRows, targetId, fp)
        if (!existing) create += 1
        else if (conflictMode === 'skip') skip += 1
        else if (conflictMode === 'replace') replace += 1
        else create += 1
      }
    }
    return { create, replace, skip }
  }, [allRows, conflictMode, rows, targetIds])

  function toggleTarget(id: string) {
    setTargetIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleDuplicate() {
    if (targetIds.length === 0) {
      toast.error('Select at least one target location.')
      return
    }
    setPending(true)
    let created = 0
    let updated = 0
    let skipped = 0
    try {
      for (const targetId of targetIds) {
        for (const row of rows) {
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
      const parts = [
        created ? `${created} added` : '',
        updated ? `${updated} updated` : '',
        skipped ? `${skipped} skipped` : '',
      ].filter(Boolean)
      toast.success(`Copied rates to ${targetIds.length} location(s): ${parts.join(', ')}.`)
      onSuccess()
      onClose()
    } catch {
      toast.error('Could not copy all rates. Some rows may have been saved — refresh and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-fg">Copy rates to other locations</h3>
            <p className="mt-1 text-sm text-fg-muted">
              From <strong className="text-fg">{sourceLabel}</strong> · {rows.length}{' '}
              {rows.length === 1 ? 'rate' : 'rates'}
            </p>
          </div>
          <button type="button" className="btn-secondary shrink-0" onClick={onClose} disabled={pending}>
            Close
          </button>
        </div>

        <p className="text-xs text-fg-muted">
          Copies unit type, floor band, ETB/m², and CMC construction stage. Pick one or more
          destinations — no need to re-type the same numbers.
        </p>

        <div className="mt-4">
          <p className="text-xs font-medium text-fg-muted">Copy to</p>
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
            {targetOptions.length === 0 ? (
              <p className="text-sm text-fg-muted">No other projects for this company.</p>
            ) : (
              targetOptions.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-fg"
                >
                  <input
                    type="checkbox"
                    checked={targetIds.includes(p.id)}
                    onChange={() => toggleTarget(p.id)}
                  />
                  {p.name}
                </label>
              ))
            )}
          </div>
          {targetOptions.length > 1 ? (
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-400"
                onClick={() => setTargetIds(targetOptions.map((p) => p.id))}
              >
                Select all
              </button>
              <button
                type="button"
                className="text-xs text-fg-muted hover:underline"
                onClick={() => setTargetIds([])}
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>

        <fieldset className="mt-4 space-y-2">
          <legend className="text-xs font-medium text-fg-muted">If target already has same rate</legend>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-fg">
            <input
              type="radio"
              name="conflict"
              checked={conflictMode === 'skip'}
              onChange={() => setConflictMode('skip')}
            />
            <span>
              <strong>Skip</strong> — keep existing rate (safe default)
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-fg">
            <input
              type="radio"
              name="conflict"
              checked={conflictMode === 'replace'}
              onChange={() => setConflictMode('replace')}
            />
            <span>
              <strong>Replace</strong> — overwrite with copied values
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-fg">
            <input
              type="radio"
              name="conflict"
              checked={conflictMode === 'add'}
              onChange={() => setConflictMode('add')}
            />
            <span>
              <strong>Add anyway</strong> — create duplicate rows (not recommended)
            </span>
          </label>
        </fieldset>

        {targetIds.length > 0 ? (
          <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900 dark:bg-brand-950/40 dark:text-brand-100">
            Preview: {preview.create} new
            {preview.replace ? `, ${preview.replace} replaced` : ''}
            {preview.skip ? `, ${preview.skip} skipped` : ''}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={pending || targetIds.length === 0}
            onClick={() => void handleDuplicate()}
          >
            {pending ? 'Copying…' : 'Copy rates'}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={pending}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
