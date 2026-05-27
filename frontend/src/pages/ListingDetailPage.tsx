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
import { AyatPriceCalculator } from '../components/AyatPriceCalculator'
import { AYAT_PARTNER } from '../content/partners'
import { useTranslation } from '../context/LocaleContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { presetFromListing } from '../lib/listingCalculatorPreset'
import {
  formatListingBedrooms,
  formatListingCardTitle,
  formatListingLocation,
} from '../lib/listingDisplay'
import { formatMoney } from '../lib/format'

const wa = import.meta.env.VITE_WHATSAPP_E164 as string | undefined

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
    enabled: Boolean(slug) && query.data?.company_slug !== AYAT_PARTNER.slug,
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
  const waHref =
    wa &&
    `https://wa.me/${wa.replace(/\D/g, '')}?text=${encodeURIComponent(
      `Hello, I am interested in: ${listing.title} (${listing.slug})`,
    )}`

  const ayatPreset = presetFromListing(listing)
  const isAyatListing = listing.company_slug === AYAT_PARTNER.slug

  const bedroomLabel = formatListingBedrooms(listing, t)
  const locationLine = [
    formatListingLocation(listing, t) || t('listingDetail.locationPending'),
    bedroomLabel,
    `${t('listingDetail.unit')} ${listing.unit_number}`,
    listing.floor_number != null
      ? `${t('listingDetail.floor')} ${listing.floor_number}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const displayTitle = formatListingCardTitle(listing, t)

  return (
    <article
      className={`mx-auto space-y-8 text-left ${isAyatListing && ayatPreset ? 'max-w-5xl' : 'max-w-4xl'}`}
    >
      <nav className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        <Link to="/apartments" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          {t('listingDetail.backToApartments')}
        </Link>
        <span aria-hidden>·</span>
        <Link
          to={`/apartments/${listing.project_slug}`}
          className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
        >
          {t('listingDetail.backToLocation')}
        </Link>
      </nav>

      <header className="space-y-3">
        <p className="section-eyebrow">
          {listing.company_name} · {listing.project_name}
        </p>
        <h1 className="text-h1">{displayTitle}</h1>
        <p className="text-body-sm">{locationLine}</p>
      </header>

      {listing.images.length > 0 ? (
        <div className="grid gap-4 overflow-hidden rounded-3xl sm:grid-cols-2">
          {listing.images.map((img) => (
            <img
              key={`${img.url}-${img.sort_order}`}
              src={img.url}
              alt=""
              className={`w-full object-cover ${img.is_primary ? 'aspect-[16/10] ring-2 ring-brand-600 sm:col-span-2' : 'h-52'}`}
            />
          ))}
        </div>
      ) : (
        <div className="surface-muted border-dashed p-16 text-center text-body-sm">
          {t('listingDetail.noGallery')}
        </div>
      )}

      {listing.description ? (
        <div className="surface p-6 sm:p-8">
          <h2 className="section-eyebrow">{t('listingDetail.aboutHome')}</h2>
          <p className="mt-3 whitespace-pre-wrap text-body">{listing.description}</p>
        </div>
      ) : null}

      {isAyatListing && ayatPreset ? (
        <AyatPriceCalculator
          variant="embedded"
          listingPreset={ayatPreset}
          listingTitle={listing.title}
        />
      ) : (
        <>
          <PricePreviewSection query={priceQuery} />
          <PaymentPreviewSection
            plansQuery={paymentPlansQuery}
            previewQuery={paymentPreviewQuery}
            planCode={planCode}
            onPlanCodeChange={setPlanCode}
            priceAvailable={!priceQuery.isError && Boolean(priceQuery.data)}
          />
        </>
      )}

      <div className="flex flex-wrap gap-3">
        {waHref ? (
          <a href={waHref} target="_blank" rel="noreferrer" className="btn-primary">
            {t('listingDetail.whatsapp')}
          </a>
        ) : (
          <span className="text-xs text-fg-muted">
            {t('listingDetail.whatsappHint', {
              var: 'VITE_WHATSAPP_E164',
              env: '.env',
            })}
          </span>
        )}
      </div>

      <LeadFormSection slug={slug} sent={leadSent} mutation={leadMutation} />
    </article>
  )
}

function PricePreviewSection({ query }: { query: ReturnType<typeof useQuery<PublicPricePreview>> }) {
  const { t } = useTranslation()

  if (query.isLoading) {
    return <div className="surface p-6 text-body-sm">{t('listingDetail.priceLoading')}</div>
  }

  if (query.isError || !query.data) {
    return (
      <div className="surface-muted p-6">
        <p className="section-eyebrow">{t('listingDetail.pricingEyebrow')}</p>
        <p className="mt-2 text-h3">{t('listingDetail.priceOnRequest')}</p>
        <p className="mt-2 text-body-sm">{t('listingDetail.priceOnRequestBody')}</p>
      </div>
    )
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
      {previewQuery.data ? (
        <p className="mt-2 text-xs text-fg-muted">{previewQuery.data.disclaimer}</p>
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
  const { t } = useTranslation()

  if (sent) {
    return (
      <div className="surface border-brand-200 bg-brand-50/80 p-6 text-sm text-brand-900 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-100">
        {t('listingDetail.thankYou', { slug })}
      </div>
    )
  }

  return (
    <form
      className="surface space-y-4 p-6 sm:p-8"
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
      <h2 className="section-eyebrow">{t('listingDetail.enquiryTitle')}</h2>
      <label className="block text-xs font-medium text-fg-muted">
        {t('listingDetail.name')}
        <input name="name" required className="input" autoComplete="name" />
      </label>
      <label className="block text-xs font-medium text-fg-muted">
        {t('listingDetail.phone')}
        <input name="phone" required type="tel" className="input" autoComplete="tel" />
      </label>
      <label className="block text-xs font-medium text-fg-muted">
        {t('listingDetail.emailOptional')}
        <input name="email" type="email" className="input" autoComplete="email" />
      </label>
      <label className="block text-xs font-medium text-fg-muted">
        {t('listingDetail.message')}
        <textarea
          name="message"
          className="input min-h-[80px]"
          rows={3}
          placeholder={t('listingDetail.messagePlaceholder')}
        />
      </label>
      {mutation.isError ? (
        <p className="text-xs text-red-600">{t('listingDetail.submitError')}</p>
      ) : null}
      <button type="submit" className="btn-primary" disabled={mutation.isPending}>
        {mutation.isPending ? t('listingDetail.sending') : t('listingDetail.sendEnquiry')}
      </button>
    </form>
  )
}
