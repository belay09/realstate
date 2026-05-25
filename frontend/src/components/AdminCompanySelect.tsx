import { useQuery } from '@tanstack/react-query'

import { api } from '../api/client'
import type { Company, Paginated } from '../api/types'

type Props = {
  value: string
  onChange: (companyId: string) => void
  className?: string
}

export function AdminCompanySelect({ value, onChange, className }: Props) {
  const companies = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Company>>('/admin/companies', { params: { limit: 100 } })
      return data
    },
  })

  return (
    <label className={`block text-xs font-medium text-stone-600 dark:text-stone-400 ${className ?? ''}`}>
      Company
      <select
        className="input mt-1 max-w-md"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select company…</option>
        {companies.data?.items.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  )
}
