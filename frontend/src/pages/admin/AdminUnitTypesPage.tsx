import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { api } from '../../api/client'
import type { Company, Paginated, UnitType } from '../../api/types'

export function AdminUnitTypesPage() {
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

  const unitTypes = useQuery({
    queryKey: ['admin', 'unit-types', companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<UnitType>>('/admin/unit-types', {
        params: { company_id: companyId },
      })
      return data
    },
  })

  const create = useMutation({
    mutationFn: (body: {
      company_id: string
      code: string
      name: string
      category: string
      bedrooms: number | null
    }) => api.post('/admin/unit-types', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'unit-types'] }),
  })

  return (
    <div className="space-y-8 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Unit types</h1>

      <form className="flex flex-wrap items-end gap-2" action="/admin/unit-types" method="get">
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
            const br = fd.get('bedrooms')
            create.mutate({
              company_id: companyId,
              code: String(fd.get('code')),
              name: String(fd.get('name')),
              category: String(fd.get('category')),
              bedrooms: br ? Number(br) : null,
            })
            e.currentTarget.reset()
          }}
        >
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">New unit type</h2>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Code
            <input name="code" required className="input" placeholder="T3" />
          </label>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Name
            <input name="name" required className="input" placeholder="Three bedroom" />
          </label>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Category
            <input name="category" required className="input" defaultValue="residential" />
          </label>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Bedrooms (optional)
            <input name="bedrooms" type="number" min={0} className="input" />
          </label>
          <button type="submit" className="btn-primary" disabled={create.isPending}>
            Create
          </button>
        </form>
      )}

      {unitTypes.isLoading && <p className="text-sm text-stone-500">Loading…</p>}

      {unitTypes.data && (
        <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
          <table className="min-w-full divide-y divide-stone-200 text-sm dark:divide-stone-800">
            <thead className="bg-stone-100 dark:bg-stone-900">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Code</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Beds</th>
                <th className="px-3 py-2 text-left font-medium"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white dark:divide-stone-800 dark:bg-stone-950">
              {unitTypes.data.items.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2 font-mono text-xs">{u.code}</td>
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.bedrooms ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-stone-500">{u.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-stone-500">
        Copy a <strong>unit type id</strong> for the Units form. From{' '}
        <Link to="/admin/companies" className="text-emerald-700 underline dark:text-emerald-400">
          Companies
        </Link>{' '}
        use the same company as blocks/units.
      </p>
    </div>
  )
}
