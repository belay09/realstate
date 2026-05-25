import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { api } from '../api/client'
import type {
  PublicListingDetail,
  PublicPaymentPlanOption,
  PublicPaymentPreview,
  PublicPricePreview,
} from '../api/types'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatMoney } from '../lib/format'

const wa = import.meta.env.VITE_WHATSAPP_E164 as string | undefined

export function ListingDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [leadSent, setLeadSent] = useState(false)
  const [planCode, setPlanCode] = useState('full')

  const query = useQuery({
    queryKey: ['public-listing', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data } = await api.get<PublicListingDetail>(`/public/listings/${slug}`)
      return data
    },
  })

  const priceQuery = useQuery({
    queryKey: ['public-listing-price', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data } = await api.get<PublicPricePreview>(`/public/listings/${slug}/price-preview`)
      return data
    },
    retry: false,
  })

  const leadMutation = useMutation({
    mutationFn: async (body: { name: string; phone: string; email: string; message: string }) => {
      const { data } = await api.post('/public/leads', {
        ...body,
        email: body.email || undefined,
        listing_slug: slug,
        source: 'website',
      })
      return data
    },
    onSuccess: () => setLeadSent(true),
  })

  usePageTitle(query.data?.title ?? 'Listing')

  const priceOk = !priceQuery.isError && Boolean(priceQuery.data)

  const paymentPlansQuery = useQuery({
    queryKey: ['public-payment-plans', slug],
    enabled: Boolean(slug) && priceOk,
    queryFn: async () => {
      const { data } = await api.get<PublicPaymentPlanOption[]>(
        `/public/listings/${slug}/payment-plans`,
      )
      return data
    },
    retry: false,
  })

  const paymentPreviewQuery = useQuery({
    queryKey: ['public-payment-preview', slug, planCode],
    enabled: Boolean(slug) && Boolean(planCode) && priceOk,
    queryFn: async () => {
      const { data } = await api.get<PublicPaymentPreview>(
        `/public/listings/${slug}/payment-preview`,
        { params: { plan_code: planCode } },
      )
      return data
    },
    retry: false,
  })

  if (!slug) {
    return <p className="text-sm text-red-600">Missing listing slug.</p>
  }

  if (query.isLoading) {
    return <p className="text-sm text-stone-500">Loading…</p>
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4 text-left">
        <p className="text-sm text-red-700 dark:text-red-400">Listing not found or no longer available.</p>
        <Link to="/listings" className="text-sm font-medium text-emerald-700 underline dark:text-emerald-400">
          Back to listings
        </Link>
      </div>
    )
  }

  const listing = query.data
  const waHref =
    wa &&
    `https://wa.me/${wa.replace(/\D/g, '')}?text=${encodeURIComponent(
      `Hello, I am interested in: ${listing.title} (${listing.slug})`,
    )}`

  return (
    <article className="mx-auto max-w-3xl space-y-8 text-left">
      <Link to="/listings" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
        ← All listings
      </Link>

      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
          {listing.company_name} · {listing.project_name}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">{listing.title}</h1>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          {[listing.city, listing.area].filter(Boolean).join(' · ') || 'Location to be confirmed'}
          {listing.bedrooms != null ? ` · ${listing.bedrooms} bedrooms` : ''} · Unit {listing.unit_number}
          {listing.floor_number != null ? `, floor ${listing.floor_number}` : ''}
        </p>
      </header>

      {listing.images.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {listing.images.map((img) => (
            <img
              key={`${img.url}-${img.sort_order}`}
              src={img.url}
              alt=""
              className={`w-full rounded-xl object-cover ${img.is_primary ? 'ring-2 ring-emerald-500 sm:col-span-2' : 'h-48'}`}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center text-sm text-stone-500 dark:border-stone-700">
          No gallery images yet.
        </div>
      )}

      {listing.description ? (
        <div className="prose prose-stone max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap text-stone-700 dark:text-stone-300">{listing.description}</p>
        </div>
      ) : null}

      <PricePreviewSection query={priceQuery} />

      <PaymentPreviewSection
        plansQuery={paymentPlansQuery}
        previewQuery={paymentPreviewQuery}
        planCode={planCode}
        onPlanCodeChange={setPlanCode}
        priceAvailable={!priceQuery.isError && Boolean(priceQuery.data)}
      />

      <div className="flex flex-wrap gap-3">
        {waHref ? (
          <a href={waHref} target="_blank" rel="noreferrer" className="btn-primary">
            WhatsApp about this home
          </a>
        ) : (
          <span className="text-xs text-stone-500">
            Set <code className="rounded bg-stone-200 px-1 dark:bg-stone-800">VITE_WHATSAPP_E164</code> in{' '}
            <code className="rounded bg-stone-200 px-1 dark:bg-stone-800">.env</code> to enable WhatsApp (E.164, no +
            ).
          </span>
        )}
      </div>

      <LeadFormSection slug={slug} sent={leadSent} mutation={leadMutation} />
    </article>
  )
}

function PricePreviewSection({ query }: { query: ReturnType<typeof useQuery<PublicPricePreview>> }) {
  if (query.isLoading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-950">
        Loading indicative price…
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <strong className="font-semibold">Price on request</strong>
        <p className="mt-1 text-amber-900/80 dark:text-amber-200/80">
          Published pricing is not available for this listing yet. Contact us for a formal quote.
        </p>
      </div>
    )
  }

  const p = query.data
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-400">
        Indicative price · {p.pricing_version_name}
      </p>
      <p className="mt-1 text-3xl font-semibold text-emerald-950 dark:text-emerald-50">
        {formatMoney(p.final_price, p.currency)}
        {p.includes_vat ? <span className="ml-2 text-sm font-normal text-emerald-800/80">incl. VAT</span> : null}
      </p>
      <p className="mt-2 text-xs text-emerald-900/70 dark:text-emerald-200/70">{p.disclaimer}</p>
    </div>
  )
}

function PaymentPreviewSection({
  plansQuery,
  previewQuery,
  planCode,
  onPlanCodeChange,
  priceAvailable,
}: {
  plansQuery: ReturnType<typeof useQuery<PublicPaymentPlanOption[]>>
  previewQuery: ReturnType<typeof useQuery<PublicPaymentPreview>>
  planCode: string
  onPlanCodeChange: (code: string) => void
  priceAvailable: boolean
}) {
  if (!priceAvailable) return null
  if (plansQuery.isLoading) {
    return <p className="text-sm text-stone-500">Loading payment options…</p>
  }
  if (!plansQuery.data?.length) return null

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-950">
      <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Payment plan preview</h2>
      <label className="mt-2 block text-xs font-medium text-stone-600 dark:text-stone-400">
        Plan
        <select
          className="input mt-1 max-w-xs"
          value={planCode}
          onChange={(e) => onPlanCodeChange(e.target.value)}
        >
          {plansQuery.data.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {previewQuery.isError ? (
        <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">This plan is not available for this unit.</p>
      ) : previewQuery.data ? (
        <ul className="mt-3 space-y-1 text-sm text-stone-700 dark:text-stone-300">
          {previewQuery.data.items.map((item) => (
            <li key={item.step_order}>
              {item.label}: {formatMoney(item.amount, previewQuery.data!.currency)}
            </li>
          ))}
        </ul>
      ) : previewQuery.isLoading ? (
        <p className="mt-2 text-xs text-stone-500">Calculating schedule…</p>
      ) : null}
      {previewQuery.data ? (
        <p className="mt-2 text-xs text-stone-500">{previewQuery.data.disclaimer}</p>
      ) : null}
    </div>
  )
}

function LeadFormSection({
  slug,
  sent,
  mutation,
}: {
  slug: string
  sent: boolean
  mutation: ReturnType<
    typeof useMutation<unknown, unknown, { name: string; phone: string; email: string; message: string }>
  >
}) {
  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
        Thank you — we received your enquiry for <strong>{slug}</strong>. Our team will contact you soon.
      </div>
    )
  }

  return (
    <form
      className="space-y-3 rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-950"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        mutation.mutate({
          name: String(fd.get('name')),
          phone: String(fd.get('phone')),
          email: String(fd.get('email') ?? ''),
          message: String(fd.get('message') ?? ''),
        })
      }}
    >
      <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Request information</h2>
      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
        Name
        <input name="name" required className="input" autoComplete="name" />
      </label>
      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
        Phone
        <input name="phone" required type="tel" className="input" autoComplete="tel" />
      </label>
      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
        Email (optional)
        <input name="email" type="email" className="input" autoComplete="email" />
      </label>
      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
        Message
        <textarea name="message" className="input min-h-[80px]" rows={3} placeholder="When would you like to visit?" />
      </label>
      {mutation.isError ? (
        <p className="text-xs text-red-600">Could not submit — check your details and try again.</p>
      ) : null}
      <button type="submit" className="btn-primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  )
}
