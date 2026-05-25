import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { api } from '../../api/client'
import type { Company, Paginated, Project } from '../../api/types'

export function AdminProjectsPage() {
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const companyId = params.get('company_id') ?? ''

  const companies = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Company>>('/admin/companies')
      return data
    },
  })

  const projects = useQuery({
    queryKey: ['admin', 'projects', companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<Project>>('/admin/projects', {
        params: { company_id: companyId },
      })
      return data
    },
  })

  const create = useMutation({
    mutationFn: (body: {
      company_id: string
      name: string
      city: string
      area: string
      status: string
    }) => api.post('/admin/projects', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'projects'] }),
  })

  return (
    <div className="space-y-8 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Projects</h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Pick a company to list projects. Open from{' '}
        <Link to="/admin/companies" className="text-emerald-700 underline dark:text-emerald-400">
          Companies
        </Link>{' '}
        or set <code className="rounded bg-stone-200 px-1 text-xs dark:bg-stone-800">?company_id=</code> in the URL.
      </p>

      <form className="flex flex-wrap items-end gap-2" action="/admin/projects" method="get">
        <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
          Company
          <select name="company_id" defaultValue={companyId} className="input min-w-[220px]">
            <option value="">Select…</option>
            {companies.data?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-secondary">
          Load
        </button>
      </form>

      {companyId && (
        <form
          className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            create.mutate({
              company_id: companyId,
              name: String(fd.get('name')),
              city: String(fd.get('city')),
              area: String(fd.get('area')),
              status: String(fd.get('status') || 'active'),
            })
            e.currentTarget.reset()
          }}
        >
          <input type="hidden" name="company_id" value={companyId} />
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">New project</h2>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Name
            <input name="name" required className="input" />
          </label>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            City
            <input name="city" className="input" placeholder="Addis Ababa" />
          </label>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Area
            <input name="area" className="input" placeholder="Ayat" />
          </label>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Status
            <input name="status" className="input" defaultValue="active" />
          </label>
          <button type="submit" className="btn-primary" disabled={create.isPending}>
            Create project
          </button>
        </form>
      )}

      {projects.isLoading && <p className="text-sm text-stone-500">Loading projects…</p>}
      {projects.data && (
        <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
          <table className="min-w-full divide-y divide-stone-200 text-sm dark:divide-stone-800">
            <thead className="bg-stone-100 dark:bg-stone-900">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Slug</th>
                <th className="px-3 py-2 text-left font-medium">City / Area</th>
                <th className="px-3 py-2 text-left font-medium"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white dark:divide-stone-800 dark:bg-stone-950">
              {projects.data.items.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2 text-stone-600 dark:text-stone-400">{p.slug}</td>
                  <td className="px-3 py-2 text-stone-600 dark:text-stone-400">
                    {[p.city, p.area].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      className="text-emerald-700 hover:underline dark:text-emerald-400"
                      to={`/admin/blocks?project_id=${p.id}`}
                    >
                      Blocks →
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
