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
import { ListingDetailLayout } from '../components/ListingDetailLayout'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import { useTranslation } from '../context/LocaleContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { siteWhatsAppHref } from '../content/siteContact'
import { presetFromListing } from '../lib/listingCalculatorPreset'
import { formatListingCardTitle } from '../lib/listingDisplay'
import { formatMoney } from '../lib/format'

export function ListingDetailPage() {
  const { t } = useTranslation()
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
    enabled:
      Boolean(slug) &&
      query.data?.company_slug !== AYAT_PARTNER.slug &&
      query.data?.company_slug !== TEMER_PARTNER.slug,
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

  const pageTitle = query.data ? formatListingCardTitle(query.data, t) : t('pageTitles.listing')
  usePageTitle(pageTitle)

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
    return <p className="text-sm text-red-600">{t('listingDetail.missingSlug')}</p>
  }

  if (query.isLoading) {
    return <p className="text-body-sm">{t('listingDetail.loading')}</p>
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4 text-left">
        <p className="text-sm text-red-700 dark:text-red-400">{t('listingDetail.notFound')}</p>
        <Link to="/apartments" className="text-sm font-semibold text-brand-700 underline dark:text-brand-300">
          {t('listingDetail.backToApartments')}
        </Link>
      </div>
    )
  }

  const listing = query.data
  const waHref = siteWhatsAppHref(
    `Hello, I am interested in: ${listing.title} (${listing.slug})`,
  )

  const ayatPreset = presetFromListing(listing)
  const isAyatListing = listing.company_slug === AYAT_PARTNER.slug
  const isTemerListing = listing.company_slug === TEMER_PARTNER.slug

  return (
    <ListingDetailLayout
      listing={listing}
      slug={slug}
      ayatPreset={ayatPreset}
      isAyatListing={isAyatListing}
      isTemerListing={isTemerListing}
      leadSent={leadSent}
      leadMutation={leadMutation}
      waHref={waHref}
    >
      <>
        <PricePreviewSection query={priceQuery} />
        <PaymentPreviewSection
          plansQuery={paymentPlansQuery}
          previewQuery={paymentPreviewQuery}
          planCode={planCode}
          onPlanCodeChange={setPlanCode}
          priceAvailable={priceOk}
        />
      </>
    </ListingDetailLayout>
  )
}

function PricePreviewSection({ query }: { query: ReturnType<typeof useQuery<PublicPricePreview>> }) {
  const { t } = useTranslation()

  if (query.isLoading) {
    return <div className="surface p-6 text-body-sm">{t('listingDetail.priceLoading')}</div>
  }

  if (query.isError || !query.data) {
    return null
  }

  const p = query.data
  return (
    <div className="surface border-brand-200/60 bg-gradient-to-br from-brand-50 to-surface p-6 sm:p-8 dark:border-brand-800 dark:from-brand-950/40">
      <p className="section-eyebrow">{t('listingDetail.indicativePrice')}</p>
      <p className="mt-1 text-xs text-fg-muted">{p.pricing_version_name}</p>
      <p className="mt-3 text-stat">
        {formatMoney(p.final_price, p.currency)}
        {p.includes_vat ? (
          <span className="ml-2 text-sm font-medium text-fg-muted">{t('listingDetail.inclVat')}</span>
        ) : null}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-fg-muted">{p.disclaimer}</p>
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
  const { t } = useTranslation()

  if (!priceAvailable) return null
  if (plansQuery.isLoading) {
    return <p className="text-body-sm">{t('listingDetail.loading')}</p>
  }
  if (!plansQuery.data?.length) return null

  return (
    <div className="surface p-6 sm:p-8">
      <h2 className="section-eyebrow">{t('listingDetail.paymentEyebrow')}</h2>
      <label className="mt-2 block text-xs font-medium text-fg-muted">
        {t('listingDetail.plan')}
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
        <p className="mt-2 text-xs text-brand-700 dark:text-brand-300">
          {t('listingDetail.planUnavailable')}
        </p>
      ) : previewQuery.data ? (
        <ul className="mt-3 space-y-1 text-body-sm text-fg">
          {previewQuery.data.items.map((item) => (
            <li key={item.step_order}>
              {item.label}: {formatMoney(item.amount, previewQuery.data!.currency)}
            </li>
          ))}
        </ul>
      ) : previewQuery.isLoading ? (
        <p className="mt-2 text-xs text-fg-muted">{t('listingDetail.calculating')}</p>
      ) : null}
    </div>
  )
}
