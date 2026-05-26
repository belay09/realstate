import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { api } from '../../api/client'
import type { Lead, Paginated } from '../../api/types'

const STATUSES = ['new', 'contacted', 'qualified', 'reserved', 'won', 'lost'] as const

export function AdminLeadsPage() {
  const qc = useQueryClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const leads = useQuery({
    queryKey: ['admin', 'leads'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Lead>>('/admin/leads', { params: { limit: 100 } })
      return data
    },
  })

  const patchStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/leads/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'leads'] }),
  })

  const linkQuote = useMutation({
    mutationFn: ({ leadId, quoteId }: { leadId: string; quoteId: string }) =>
      api.post(`/admin/leads/${leadId}/quotes`, { quote_id: quoteId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'leads'] }),
  })

  const reserve = useMutation({
    mutationFn: (quoteId: string) => api.post('/admin/reservations', { quote_id: quoteId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'leads'] }),
  })

  const contract = useMutation({
    mutationFn: (body: { quote_id: string; buyer_name: string; signed: boolean }) =>
      api.post('/admin/contracts', {
        quote_id: body.quote_id,
        buyer_name: body.buyer_name,
        signed_date: body.signed ? new Date().toISOString().slice(0, 10) : undefined,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'leads'] }),
  })

  return (
    <div className="space-y-6 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Leads & sales flow</h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Follow up enquiries → link a quote from <strong>Quotes</strong> → reserve unit → sign contract (marks unit
        sold).
      </p>

      {leads.isLoading ? <p className="text-sm text-stone-500">Loading…</p> : null}
      {leads.isError ? <p className="text-sm text-red-600">Could not load leads.</p> : null}

      {leads.data && leads.data.total === 0 ? (
        <p className="text-sm text-stone-500">No leads yet. Submit one from a listing detail page.</p>
      ) : null}

      <ul className="space-y-3">
        {leads.data?.items.map((lead) => (
          <li
            key={lead.id}
            className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-900 dark:text-stone-100">{lead.name}</p>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {lead.phone}
                  {lead.email ? ` · ${lead.email}` : ''}
                </p>
                {lead.message ? (
                  <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">{lead.message}</p>
                ) : null}
                <p className="mt-1 text-xs text-stone-500">
                  {new Date(lead.created_at).toLocaleString()} · {lead.source}
                  {lead.quote_id ? (
                    <>
                      {' '}
                      · quote{' '}
                      <span className="font-mono text-stone-400">{lead.quote_id.slice(0, 8)}…</span>
                    </>
                  ) : null}
                </p>
              </div>
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Status
                <select
                  className="input mt-1 w-auto min-w-[8rem]"
                  value={lead.status}
                  disabled={patchStatus.isPending}
                  onChange={(e) => patchStatus.mutate({ id: lead.id, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  {!STATUSES.includes(lead.status as (typeof STATUSES)[number]) ? (
                    <option value={lead.status}>{lead.status}</option>
                  ) : null}
                </select>
              </label>
            </div>

            <button
              type="button"
              className="mt-3 text-xs font-medium text-brand-700 underline dark:text-brand-400"
              onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
            >
              {expandedId === lead.id ? 'Hide sales actions' : 'Sales actions (quote → reserve → contract)'}
            </button>

            {expandedId === lead.id ? (
              <LeadSalesActions
                lead={lead}
                onLinkQuote={(quoteId) => linkQuote.mutate({ leadId: lead.id, quoteId })}
                onReserve={(quoteId) => reserve.mutate(quoteId)}
                onContract={(body) => contract.mutate(body)}
                busy={linkQuote.isPending || reserve.isPending || contract.isPending}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

function LeadSalesActions({
  lead,
  onLinkQuote,
  onReserve,
  onContract,
  busy,
}: {
  lead: Lead
  onLinkQuote: (quoteId: string) => void
  onReserve: (quoteId: string) => void
  onContract: (body: { quote_id: string; buyer_name: string; signed: boolean }) => void
  busy: boolean
}) {
  const [quoteId, setQuoteId] = useState(lead.quote_id ?? '')
  const [buyerName, setBuyerName] = useState(lead.name)
  const [signed, setSigned] = useState(true)

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-900">
      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
        Quote ID (from Quotes page)
        <input
          className="input mt-1 font-mono text-xs"
          value={quoteId}
          onChange={(e) => setQuoteId(e.target.value)}
          placeholder="UUID"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary text-xs"
          disabled={busy || !quoteId}
          onClick={() => onLinkQuote(quoteId)}
        >
          Link quote to lead
        </button>
        <button
          type="button"
          className="btn-secondary text-xs"
          disabled={busy || !quoteId}
          onClick={() => onReserve(quoteId)}
        >
          Create reservation
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Buyer name (contract)
          <input className="input mt-1" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 pt-5 text-xs text-stone-600 dark:text-stone-400">
          <input type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} />
          Mark signed (unit → sold)
        </label>
      </div>
      <button
        type="button"
        className="btn-primary text-xs"
        disabled={busy || !quoteId || !buyerName}
        onClick={() => onContract({ quote_id: quoteId, buyer_name: buyerName, signed })}
      >
        Create contract
      </button>
    </div>
  )
}
