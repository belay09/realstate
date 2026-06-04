import { Link } from 'react-router-dom'

import type { PublicListingSummary } from '../api/types'
import { useTranslation } from '../context/LocaleContext'
import {
  formatListingBedrooms,
  formatListingCardTitle,
  formatListingLocation,
  finishKindFromUnitTypeCode,
} from '../lib/listingDisplay'
import { ListingCardImageCarousel } from './ListingCardImageCarousel'

type Props = {
  listing: PublicListingSummary
  index?: number
}

function buildingTypeLabel(
  type: PublicListingSummary['building_type'],
  useSegment: PublicListingSummary['use_segment'],
  t: (key: string) => string,
): string | null {
  if (!type) return null
  if (type === 'mixed') {
    return useSegment === 'retail'
      ? t('layoutCard.buildingMixedShop')
      : useSegment === 'residential'
        ? t('layoutCard.buildingMixedApt')
        : t('buildingType.mixedTitle')
  }
  if (type === 'duplex') return t('buildingType.duplexTitle')
  if (type === 'flat') return t('buildingType.flatTitle')
  return null
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-canvas/80 px-3 py-2.5 text-center dark:bg-canvas/40">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-fg-muted">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-fg">{value}</dd>
    </div>
  )
}

export function LocationLayoutCard({ listing, index = 0 }: Props) {
  const { t } = useTranslation()
  const title = formatListingCardTitle(listing, t)
  const location = formatListingLocation(listing, t)
  const detailHref = `/listings/${listing.slug}`
  const imageUrls =
    listing.image_urls && listing.image_urls.length > 0
      ? listing.image_urls
      : listing.primary_image_url
        ? [listing.primary_image_url]
        : []

  const beds = formatListingBedrooms(listing, t)
  const finish = finishKindFromUnitTypeCode(listing.unit_type_code)
  const finishLabel =
    finish === 'regular-finished'
      ? t('listingCard.regularFinished')
      : finish === 'semi-finished'
        ? t('listingCard.semiFinished')
        : listing.unit_type_name

  const buildingLabel = buildingTypeLabel(listing.building_type, listing.use_segment, t)

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition duration-300 hover:border-brand-400/40 hover:shadow-lg hover:shadow-brand-900/10 dark:hover:border-brand-600/35">
      <div className="flex flex-col @md:flex-row">
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950 @md:aspect-auto @md:w-48 @lg:w-56">
          {imageUrls.length > 0 ? (
            <ListingCardImageCarousel urls={imageUrls} alt={title} startOffset={index} />
          ) : (
            <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 text-slate-400 @md:min-h-[220px]">
              <PhotoIcon />
              <span className="text-xs font-medium">{t('listingCard.photoSoon')}</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent @md:bg-gradient-to-r @md:from-slate-950/30" />
          {buildingLabel ? (
            <span className="absolute left-3 top-3 z-[2] rounded-full bg-violet-600/95 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white shadow">
              {buildingLabel}
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-5 @md:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            {location}
          </p>
          <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight text-fg @lg:text-xl">
            <Link to={detailHref} className="hover:text-brand-700 dark:hover:text-brand-300">
              {title}
            </Link>
          </h3>

          <dl className="mt-4 grid grid-cols-2 gap-2 @md:grid-cols-4">
            <SpecItem label={t('layoutCard.bedrooms')} value={beds ?? t('layoutCard.notSpecified')} />
            <SpecItem label={t('layoutCard.finish')} value={finishLabel} />
            <SpecItem
              label={t('layoutCard.size')}
              value={listing.property_size ?? t('layoutCard.notSpecified')}
            />
            <SpecItem
              label={t('layoutCard.floor')}
              value={
                listing.floor_number != null
                  ? String(listing.floor_number)
                  : t('layoutCard.notSpecified')
              }
            />
          </dl>

          {listing.description_preview ? (
            <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-fg-muted @lg:line-clamp-5">
              {listing.description_preview}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Link to={detailHref} className="btn-primary text-sm">
              {t('layoutCard.viewDetails')}
            </Link>
            <span className="hidden text-xs text-fg-muted @lg:inline">{t('layoutCard.viewDetailsHint')}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

function PhotoIcon() {
  return (
    <svg className="h-10 w-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
      />
    </svg>
  )
}
