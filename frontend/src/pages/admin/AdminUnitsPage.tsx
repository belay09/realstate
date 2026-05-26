import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'

import { api } from '../../api/client'
import type { Block, Paginated, PropertyUnit } from '../../api/types'

export function AdminUnitsPage() {
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const blockId = params.get('block_id') ?? ''

  const block = useQuery({
    queryKey: ['admin', 'block', blockId],
    enabled: Boolean(blockId),
    queryFn: async () => {
      const { data } = await api.get<Block>(`/admin/blocks/${blockId}`)
      return data
    },
  })

  const units = useQuery({
    queryKey: ['admin', 'units', blockId],
    enabled: Boolean(blockId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<PropertyUnit>>('/admin/units', {
        params: { block_id: blockId },
      })
      return data
    },
  })

  const create = useMutation({
    mutationFn: (body: {
      block_id: string
      unit_type_id: string
      unit_number: string
      status: string
    }) => api.post('/admin/units', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'units'] }),
  })

  const setStatus = useMutation({
    mutationFn: ({ id, to_status }: { id: string; to_status: string }) =>
      api.post(`/admin/units/${id}/status`, { to_status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'units'] }),
  })

  return (
    <div className="space-y-8 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Units</h1>

      <form className="flex flex-wrap items-end gap-2" action="/admin/units" method="get">
        <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
          Block ID (UUID)
          <input name="block_id" defaultValue={blockId} className="input font-mono text-xs" />
        </label>
        <button type="submit" className="btn-secondary">
          Load
        </button>
      </form>

      {block.data && (
        <p className="text-sm text-stone-600 dark:text-stone-300">
          Block: <strong>{block.data.name}</strong>
        </p>
      )}

      {blockId && (
        <form
          className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            create.mutate({
              block_id: blockId,
              unit_type_id: String(fd.get('unit_type_id')),
              unit_number: String(fd.get('unit_number')),
              status: String(fd.get('status') || 'draft'),
            })
            e.currentTarget.reset()
          }}
        >
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">New unit</h2>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Unit type ID (UUID)
            <input name="unit_type_id" required className="input font-mono text-xs" />
          </label>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Unit number
            <input name="unit_number" required className="input" placeholder="101" />
          </label>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Initial status
            <select name="status" className="input" defaultValue="draft">
              <option value="draft">draft</option>
              <option value="available">available</option>
            </select>
          </label>
          <button type="submit" className="btn-primary" disabled={create.isPending}>
            Create unit
          </button>
        </form>
      )}

      {units.isLoading && <p className="text-sm text-stone-500">Loading…</p>}

      {units.data && (
        <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
          <table className="min-w-full divide-y divide-stone-200 text-sm dark:divide-stone-800">
            <thead className="bg-stone-100 dark:bg-stone-900">
              <tr>
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Floor</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white dark:divide-stone-800 dark:bg-stone-950">
              {units.data.items.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2 font-medium">{u.unit_number}</td>
                  <td className="px-3 py-2">{u.status}</td>
                  <td className="px-3 py-2">{u.floor_number ?? '-'}</td>
                  <td className="space-x-2 px-3 py-2">
                    {u.status !== 'available' && (
                      <button
                        type="button"
                        className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-400"
                        onClick={() => setStatus.mutate({ id: u.id, to_status: 'available' })}
                      >
                        Mark available
                      </button>
                    )}
                    {u.status !== 'sold' && (
                      <button
                        type="button"
                        className="text-xs font-medium text-stone-600 hover:underline dark:text-stone-400"
                        onClick={() => setStatus.mutate({ id: u.id, to_status: 'sold' })}
                      >
                        Mark sold
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
