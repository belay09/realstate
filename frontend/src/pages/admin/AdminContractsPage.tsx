import { useQuery } from '@tanstack/react-query'

import { api } from '../../api/client'
import { formatMoney } from '../../lib/format'
import type { Paginated } from '../../api/types'

type Contract = {
  id: string
  quote_id: string
  contract_number: string
  buyer_name: string
  locked_price: string
  status: string
  signed_date: string | null
  created_at: string
}

export function AdminContractsPage() {
  const contracts = useQuery({
    queryKey: ['admin', 'contracts'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Contract>>('/admin/contracts', { params: { limit: 100 } })
      return data
    },
  })

  return (
    <div className="space-y-6 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Contracts</h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Signed contracts lock price and can mark units as sold. Create contracts from the Leads page.
      </p>

      {contracts.isLoading ? <p className="text-sm text-stone-500">Loading…</p> : null}
      {contracts.data?.total === 0 ? (
        <p className="text-sm text-stone-500">No contracts yet.</p>
      ) : null}

      <ul className="space-y-2">
        {contracts.data?.items.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-stone-200 bg-white p-4 text-sm dark:border-stone-800 dark:bg-stone-950"
          >
            <p className="font-medium text-stone-900 dark:text-stone-100">
              {c.contract_number} · {c.buyer_name}
            </p>
            <p className="text-stone-600 dark:text-stone-400">
              {formatMoney(c.locked_price, 'ETB')} · {c.status}
              {c.signed_date ? ` · signed ${c.signed_date}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
