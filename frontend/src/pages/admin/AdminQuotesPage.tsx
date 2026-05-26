import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { api } from '../../api/client'
import type { Company, FullQuoteResponse, Paginated, PaymentPlan } from '../../api/types'
import { formatMoney } from '../../lib/format'

export function AdminQuotesPage() {
  const [companyId, setCompanyId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [planId, setPlanId] = useState('')
  const [result, setResult] = useState<FullQuoteResponse | null>(null)

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

  const generate = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<FullQuoteResponse>('/admin/quotes/generate', {
        unit_id: unitId,
        payment_plan_id: planId || undefined,
        sales_channel: 'default',
        persist_quote: true,
      })
      return data
    },
    onSuccess: (data) => setResult(data),
  })

  return (
    <div className="space-y-6 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Quote calculator</h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Generates pricing, installment schedule, and commission estimate. Copy a unit ID from the{' '}
        <strong>Units</strong> page (demo unit 501 at Ayat works after seed).
      </p>

      <form
        className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
        onSubmit={(e) => {
          e.preventDefault()
          generate.mutate()
        }}
      >
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Company (for payment plans)
          <select
            className="input mt-1"
            value={companyId}
            onChange={(e) => {
              setCompanyId(e.target.value)
              setPlanId('')
            }}
          >
            <option value="">Select…</option>
          {companies.data?.items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        </label>

        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Unit ID
          <input
            required
            className="input font-mono text-xs"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            placeholder="UUID from admin units"
          />
        </label>

        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Payment plan (optional)
          <select
            className="input mt-1"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            disabled={!companyId}
          >
            <option value="">Pricing only</option>
            {plans.data?.items
              .filter((p) => p.status === 'published')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
          </select>
        </label>

        {generate.isError ? (
          <p className="text-xs text-red-600">Quote failed. Check unit has published pricing and plan is valid.</p>
        ) : null}

        <button type="submit" className="btn-primary" disabled={generate.isPending || !unitId}>
          {generate.isPending ? 'Calculating…' : 'Generate quote'}
        </button>
      </form>

      {result ? <QuoteResult data={result} /> : null}
    </div>
  )
}

function QuoteResult({ data }: { data: FullQuoteResponse }) {
  const p = data.pricing
  return (
    <div className="space-y-4 rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-950/30">
      <div>
        <p className="text-xs uppercase text-brand-800 dark:text-brand-400">{p.pricing_version_name}</p>
        <p className="text-2xl font-semibold text-brand-950 dark:text-brand-50">
          {formatMoney(p.final_price, p.currency)}
        </p>
        {data.quote ? (
          <p className="mt-1 font-mono text-xs text-stone-600">Quote ID: {data.quote.id}</p>
        ) : null}
      </div>

      {data.installment_schedule ? (
        <div>
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Installments</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {data.installment_schedule.items.map((item) => (
              <li key={item.step_order}>
                {item.label}: {formatMoney(item.amount, p.currency)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.commission ? (
        <p className="text-sm text-stone-700 dark:text-stone-300">
          Commission estimate: {formatMoney(data.commission.amount, p.currency)}
        </p>
      ) : null}
    </div>
  )
}
