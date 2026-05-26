import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { api } from '../../api/client'
import type { Company, Paginated, PaymentPlan } from '../../api/types'

export function AdminPaymentPlansPage() {
  const [companyId, setCompanyId] = useState('')

  const companies = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Company>>('/admin/companies', { params: { limit: 100 } })
      return data
    },
  })

  const plans = useQuery({
    queryKey: ['admin', 'payment-plans', companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<PaymentPlan>>('/admin/payment-plans', {
        params: { company_id: companyId, limit: 50 },
      })
      return data
    },
  })

  return (
    <div className="space-y-6 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Payment plans</h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Published plans from seed data include <strong>full</strong> and <strong>60_40</strong>. Use plan IDs in the
        quote calculator.
      </p>

      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
        Company
        <select
          className="input mt-1 max-w-md"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        >
          <option value="">Select company…</option>
          {companies.data?.items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {plans.isLoading ? <p className="text-sm text-stone-500">Loading plans…</p> : null}
      {plans.isError ? <p className="text-sm text-red-600">Could not load payment plans.</p> : null}

      <ul className="space-y-3">
        {plans.data?.items.map((plan) => (
          <li
            key={plan.id}
            className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
          >
            <p className="font-medium text-stone-900 dark:text-stone-100">
              {plan.name}{' '}
              <span className="font-mono text-xs text-stone-500">({plan.code})</span>
            </p>
            <p className="text-xs text-stone-500">
              Status: {plan.status} · ID: <span className="font-mono">{plan.id}</span>
            </p>
            {plan.steps.length > 0 ? (
              <ol className="mt-2 list-decimal pl-5 text-sm text-stone-700 dark:text-stone-300">
                {plan.steps.map((s) => (
                  <li key={s.id}>
                    Step {s.step_order}: {s.percentage}%
                    {s.milestone_name ? `: ${s.milestone_name}` : ''}
                  </li>
                ))}
              </ol>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
