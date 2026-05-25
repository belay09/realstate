import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { api } from '../../api/client'
import type { Block, Paginated, Project } from '../../api/types'

export function AdminBlocksPage() {
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const projectId = params.get('project_id') ?? ''

  const project = useQuery({
    queryKey: ['admin', 'project', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await api.get<Project>(`/admin/projects/${projectId}`)
      return data
    },
  })

  const blocks = useQuery({
    queryKey: ['admin', 'blocks', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<Block>>('/admin/blocks', {
        params: { project_id: projectId },
      })
      return data
    },
  })

  const create = useMutation({
    mutationFn: (body: { project_id: string; name: string }) => api.post('/admin/blocks', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'blocks'] }),
  })

  return (
    <div className="space-y-8 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Blocks</h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Open from a project’s &quot;Blocks&quot; link, or append{' '}
        <code className="rounded bg-stone-200 px-1 text-xs dark:bg-stone-800">?project_id=</code> to the URL.
      </p>

      <form className="flex flex-wrap items-end gap-2" action="/admin/blocks" method="get">
        <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
          Project ID (UUID)
          <input name="project_id" defaultValue={projectId} className="input font-mono text-xs" />
        </label>
        <button type="submit" className="btn-secondary">
          Load
        </button>
      </form>

      {project.data && (
        <p className="text-sm text-stone-600 dark:text-stone-300">
          Project: <strong>{project.data.name}</strong> ({project.data.slug})
        </p>
      )}

      {projectId && (
        <form
          className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            create.mutate({ project_id: projectId, name: String(fd.get('name')) })
            e.currentTarget.reset()
          }}
        >
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">New block</h2>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Name
            <input name="name" required className="input" placeholder="Block A" />
          </label>
          <button type="submit" className="btn-primary" disabled={create.isPending}>
            Create block
          </button>
        </form>
      )}

      {blocks.isLoading && <p className="text-sm text-stone-500">Loading…</p>}

      {blocks.data && (
        <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
          <table className="min-w-full divide-y divide-stone-200 text-sm dark:divide-stone-800">
            <thead className="bg-stone-100 dark:bg-stone-900">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Code</th>
                <th className="px-3 py-2 text-left font-medium"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white dark:divide-stone-800 dark:bg-stone-950">
              {blocks.data.items.map((b) => (
                <tr key={b.id}>
                  <td className="px-3 py-2 font-medium">{b.name}</td>
                  <td className="px-3 py-2 text-stone-600 dark:text-stone-400">{b.code ?? '—'}</td>
                  <td className="px-3 py-2">
                    <Link
                      className="text-emerald-700 hover:underline dark:text-emerald-400"
                      to={`/admin/units?block_id=${b.id}`}
                    >
                      Units →
                    </Link>
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
