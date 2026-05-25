import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../../api/client'
import type { Company, Paginated } from '../../api/types'

export function AdminCompaniesPage() {
  const qc = useQueryClient()
  const list = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Company>>('/admin/companies')
      return data
    },
  })

  const create = useMutation({
    mutationFn: (body: { name: string; is_active: boolean }) => api.post('/admin/companies', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'companies'] }),
  })

  return (
    <div className="space-y-8 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Companies</h1>

      <form
        className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          create.mutate({
            name: String(fd.get('name')),
            is_active: fd.get('is_active') === 'on',
          })
          e.currentTarget.reset()
        }}
      >
        <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">New company</h2>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Name
          <input name="name" required className="input" placeholder="Ayat Real Estate" />
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
          <input name="is_active" type="checkbox" defaultChecked className="rounded border-stone-400" />
          Active
        </label>
        <button type="submit" className="btn-primary" disabled={create.isPending}>
          Create
        </button>
        {create.isError && (
          <p className="text-xs text-red-600">{(create.error as Error).message}</p>
        )}
      </form>

      {list.isLoading && <p className="text-sm text-stone-500">Loading…</p>}
      {list.isError && <p className="text-sm text-red-600">Failed to load companies.</p>}

      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
        <table className="min-w-full divide-y divide-stone-200 text-sm dark:divide-stone-800">
          <thead className="bg-stone-100 dark:bg-stone-900">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Slug</th>
              <th className="px-3 py-2 text-left font-medium">Active</th>
              <th className="px-3 py-2 text-left font-medium"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white dark:divide-stone-800 dark:bg-stone-950">
            {list.data?.items.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2 font-medium text-stone-900 dark:text-stone-100">{c.name}</td>
                <td className="px-3 py-2 text-stone-600 dark:text-stone-400">{c.slug}</td>
                <td className="px-3 py-2">{c.is_active ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">
                  <Link className="text-emerald-700 hover:underline dark:text-emerald-400" to={`/admin/projects?company_id=${c.id}`}>
                    Projects →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
