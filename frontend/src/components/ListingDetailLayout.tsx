import * as React from 'react'
import { Link } from 'react-router-dom'

import type { PublicListingDetail } from '../api/types'
import { AyatPriceCalculator } from './AyatPriceCalculator'
import { ListingMapEmbed } from './ListingMapEmbed'
import { PartnerLogo } from './PartnerLogo'
import { SITE_CONTACT } from '../content/siteContact'
import { useTranslation } from '../context/LocaleContext'
import type { ListingCalculatorPreset } from '../lib/listingCalculatorPreset'
import {
  formatListingBedrooms,
  formatListingCardTitle,
  formatListingLocation,
} from '../lib/listingDisplay'

type TabId = 'overview' | 'details' | 'features' | 'map'

type LeadMutation = ReturnType<
  typeof import('@tanstack/react-query').useMutation<
    unknown,
    unknown,
    { name: string; phone: string; email: string; message: string }
  >
>

type ListingDetailLayoutProps = {
  listing: PublicListingDetail
  slug: string
  ayatPreset: ListingCalculatorPreset | null
  isAyatListing: boolean
  isTemerListing: boolean
  leadSent: boolean
  leadMutation: LeadMutation
  waHref: string
  children?: React.ReactNode
}

export function ListingDetailLayout({
  listing,
  slug,
  ayatPreset,
  isAyatListing,
  isTemerListing,
  leadSent,
  leadMutation,
  waHref,
  children,
}: ListingDetailLayoutProps) {
  const { t } = useTranslation()
  const [tab, setTab] = React.useState<TabId>('overview')
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0)
  const meta = listing.listing_metadata
  const isCommercial = meta?.property_kind === 'commercial'
  const galleryImages = React.useMemo(
    () =>
      Array.from(
        new Map(
          listing.images
            .filter((img) => img.url?.trim())
            .map((img) => [img.url, img]),
        ).values(),
      ),
    [listing.images],
  )
  const activeImage = galleryImages[selectedImageIndex] ?? galleryImages[0] ?? null
  const previewImages = galleryImages.slice(0, 7)
  const hiddenImageCount = Math.max(galleryImages.length - previewImages.length, 0)

  React.useEffect(() => {
    setSelectedImageIndex(0)
  }, [listing.slug])

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: t('listingDetail.tabOverview') },
    { id: 'details', label: t('listingDetail.tabDetails') },
    { id: 'features', label: t('listingDetail.tabFeatures') },
    { id: 'map', label: t('listingDetail.tabMap') },
  ]

  const displayTitle = formatListingCardTitle(listing, t)
  const bedroomLabel = formatListingBedrooms(listing, t)
  const defaultMessage = t('listingDetail.interestedIn', { title: listing.title })

  const overviewRows = [
    meta?.specs?.Category && { label: t('listingDetail.specCategory'), value: meta.specs.Category },
    bedroomLabel && !isCommercial && {
      label: t('listingDetail.specBedrooms'),
      value: bedroomLabel,
    },
    meta?.specs?.Bathrooms && {
      label: t('listingDetail.specBathrooms'),
      value: meta.specs.Bathrooms,
    },
    (meta?.specs?.['Property Size'] || listing.area_sqm) && {
      label: t('listingDetail.specSize'),
      value: meta?.specs?.['Property Size'] ?? `${listing.area_sqm} m²`,
    },
    meta?.specs?.['Delivery Time'] && {
      label: t('listingDetail.specDelivery'),
      value: meta.specs['Delivery Time'],
    },
    meta?.specs?.Location && {
      label: t('listingDetail.specLocation'),
      value: meta.specs.Location,
    },
  ].filter(Boolean) as { label: string; value: string }[]

  const featureGroups = meta?.features
    ? [
        { key: 'interior', title: t('listingDetail.featuresInterior'), items: meta.features.interior },
        { key: 'outdoor', title: t('listingDetail.featuresOutdoor'), items: meta.features.outdoor },
        { key: 'utilities', title: t('listingDetail.featuresUtilities'), items: meta.features.utilities },
        { key: 'other', title: t('listingDetail.featuresOther'), items: meta.features.other },
      ].filter((g) => g.items.length > 0)
    : []

  const specEntries = meta?.specs
    ? Object.entries(meta.specs).filter(([, v]) => v?.trim())
    : []

  return (
    <article className="mx-auto max-w-6xl space-y-6 text-left">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        <Link to="/apartments" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          {t('listingDetail.backToApartments')}
        </Link>
        <span aria-hidden>·</span>
        <Link
          to={`/apartments/${listing.project_slug}`}
          className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
        >
          {listing.project_name}
        </Link>
      </nav>

      {galleryImages.length > 0 ? (
        <div className="space-y-3">
          {activeImage ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface-muted">
              <img
                src={activeImage.url}
                alt={displayTitle}
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {previewImages.map((img, idx) => (
              <button
                key={`${img.url}-${idx}`}
                type="button"
                onClick={() => setSelectedImageIndex(idx)}
                className={`group relative overflow-hidden rounded-xl border transition ${
                  idx === selectedImageIndex
                    ? 'border-brand-600 ring-2 ring-brand-200 dark:border-brand-400 dark:ring-brand-900'
                    : 'border-border hover:border-brand-300 dark:hover:border-brand-700'
                }`}
              >
                <img
                  src={img.url}
                  alt=""
                  className="h-24 w-full object-cover sm:h-28"
                />
                {idx === previewImages.length - 1 && hiddenImageCount > 0 ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                    +{hiddenImageCount} {t('listingDetail.morePhotos')}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="surface-muted border-dashed p-12 text-center text-body-sm">
          {t('listingDetail.noGallery')}
        </div>
      )}

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-800 dark:bg-brand-950 dark:text-brand-200">
            {listing.company_name}
          </span>
          {isCommercial ? (
            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
              {t('listingDetail.commercial')}
            </span>
          ) : (
            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
              {t('listingDetail.apartment')}
            </span>
          )}
        </div>
        <h1 className="text-h1">{displayTitle}</h1>
        <p className="text-body-sm text-fg-muted">
          {formatListingLocation(listing, t)} · {listing.project_name}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-1 border-b border-border">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  tab === item.id
                    ? 'border-emerald-600 text-emerald-800 dark:border-emerald-500 dark:text-emerald-300'
                    : 'border-transparent text-fg-muted hover:text-fg'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="surface space-y-6 p-6 sm:p-8">
              {overviewRows.length > 0 ? (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {overviewRows.map((row) => (
                    <li key={row.label}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                        {row.label}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-fg">{row.value}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              {listing.description ? (
                <div>
                  <h2 className="section-eyebrow">{t('listingDetail.aboutHome')}</h2>
                  <p className="mt-3 whitespace-pre-wrap text-body-sm">{listing.description}</p>
                </div>
              ) : null}
            </div>
          )}

          {tab === 'details' && (
            <div className="surface p-6 sm:p-8">
              <h2 className="section-eyebrow">{t('listingDetail.tabDetails')}</h2>
              {specEntries.length > 0 ? (
                <dl className="mt-4 divide-y divide-border">
                  {specEntries.map(([key, value]) => (
                    <div key={key} className="grid gap-1 py-3 sm:grid-cols-[minmax(140px,38%)_1fr]">
                      <dt className="text-sm font-semibold text-fg-muted">{key}</dt>
                      <dd className="text-sm text-fg">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-body-sm text-fg-muted">{t('listingDetail.noDetails')}</p>
              )}
              <p className="mt-4 text-xs text-fg-muted">
                {t('listingDetail.unit')} {listing.unit_number}
                {listing.floor_number != null
                  ? ` · ${t('listingDetail.floor')} ${listing.floor_number}`
                  : ''}
              </p>
            </div>
          )}

          {tab === 'features' && (
            <div className="surface p-6 sm:p-8">
              <h2 className="section-eyebrow">{t('listingDetail.tabFeatures')}</h2>
              {featureGroups.length > 0 ? (
                <div className="mt-6 grid gap-8 sm:grid-cols-2">
                  {featureGroups.map((group) => (
                    <div key={group.key}>
                      <h3 className="text-sm font-bold text-fg">{group.title}</h3>
                      <ul className="mt-3 space-y-2">
                        {group.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-fg">
                            <span
                              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white"
                              aria-hidden
                            >
                              ✓
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-body-sm text-fg-muted">{t('listingDetail.noFeatures')}</p>
              )}
            </div>
          )}

          {tab === 'map' && (
            <div className="surface p-6 sm:p-8">
              <h2 className="section-eyebrow">{t('listingDetail.tabMap')}</h2>
              {meta?.map ? (
                <ListingMapEmbed map={meta.map} className="mt-4" />
              ) : (
                <p className="mt-3 text-body-sm text-fg-muted">{t('listingDetail.noMap')}</p>
              )}
            </div>
          )}

          {isAyatListing && ayatPreset ? (
            <AyatPriceCalculator
              variant="embedded"
              listingPreset={ayatPreset}
              listingTitle={listing.title}
            />
          ) : isTemerListing ? (
            <div className="surface-muted p-6 sm:p-8">
              <p className="section-eyebrow">{t('temer.priceOnRequestTitle')}</p>
              <p className="mt-2 text-body-sm">{t('temer.priceOnRequestBody')}</p>
              <p className="mt-3 text-sm font-semibold text-fg">
                {t('contact.label')}:{' '}
                <a href={SITE_CONTACT.telHref} className="text-brand-700 dark:text-brand-300">
                  {SITE_CONTACT.phoneDisplay}
                </a>
              </p>
              <a
                href="https://temerproperties.com/price-calculator/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex text-sm font-semibold text-brand-700 underline dark:text-brand-300"
              >
                {t('temer.temerCalculatorLink')}
              </a>
            </div>
          ) : (
            children
          )}
        </div>

        <aside className="surface sticky top-24 space-y-4 p-6 lg:p-7">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <PartnerLogo
              companySlug={listing.company_slug}
              companyName={listing.company_name}
              size="sm"
            />
            <div>
              <p className="text-sm font-bold text-fg">{listing.company_name}</p>
              <p className="text-xs text-fg-muted">{t('listingDetail.salesOffice')}</p>
            </div>
          </div>

          <p className="rounded-lg bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white">
            {t('listingDetail.scheduleShowing')}
          </p>

          {leadSent ? (
            <p className="text-sm text-brand-800 dark:text-brand-200">
              {t('listingDetail.thankYou', { slug })}
            </p>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                leadMutation.mutate({
                  name: String(fd.get('name')),
                  phone: String(fd.get('phone')),
                  email: String(fd.get('email') ?? ''),
                  message: String(fd.get('message') ?? defaultMessage),
                })
              }}
            >
              <label className="block text-xs font-medium text-fg-muted">
                {t('listingDetail.name')}
                <input name="name" required className="input mt-1" autoComplete="name" />
              </label>
              <label className="block text-xs font-medium text-fg-muted">
                {t('listingDetail.emailOptional')}
                <input name="email" type="email" className="input mt-1" autoComplete="email" />
              </label>
              <label className="block text-xs font-medium text-fg-muted">
                {t('listingDetail.phone')}
                <input name="phone" required type="tel" className="input mt-1" autoComplete="tel" />
              </label>
              <label className="block text-xs font-medium text-fg-muted">
                {t('listingDetail.message')}
                <textarea
                  name="message"
                  className="input mt-1 min-h-[88px]"
                  rows={3}
                  defaultValue={defaultMessage}
                />
              </label>
              {leadMutation.isError ? (
                <p className="text-xs text-red-600">{t('listingDetail.submitError')}</p>
              ) : null}
              <button type="submit" className="btn-primary w-full" disabled={leadMutation.isPending}>
                {leadMutation.isPending ? t('listingDetail.sending') : t('listingDetail.sendEnquiry')}
              </button>
            </form>
          )}

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <a href={SITE_CONTACT.telHref} className="btn-primary w-full justify-center text-center">
              {t('listingDetail.call')} · {SITE_CONTACT.phoneDisplay}
            </a>
            <a href={waHref} target="_blank" rel="noreferrer" className="btn-secondary w-full justify-center">
              {t('listingDetail.whatsapp')}
            </a>
          </div>
        </aside>
      </div>
    </article>
  )
}
