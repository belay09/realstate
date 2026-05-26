import { Link } from 'react-router-dom'

import type { PublicListingSummary } from '../api/types'
import { useTranslation } from '../context/LocaleContext'
import {
  formatListingBedrooms,
  formatListingCardTitle,
  formatListingLocation,
} from '../lib/listingDisplay'

type ListingCardProps = {
  item: PublicListingSummary
}

export function ListingCard({ item }: ListingCardProps) {
  const { t } = useTranslation()
  const title = formatListingCardTitle(item, t)
  const location = formatListingLocation(item, t)
  const beds = formatListingBedrooms(item, t)

  return (
    <Link
      to={`/listings/${item.slug}`}
      className="group surface relative flex h-full flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(2,132,199,0.25)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
        {item.primary_image_url ? (
          <img
            src={item.primary_image_url}
            alt=""
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-body-sm">{t('listingCard.photoSoon')}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
          <span className="badge-sale">{t('listingCard.forSale')}</span>
          <span className="max-w-[55%] truncate rounded-full bg-surface/95 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-brand-800 shadow backdrop-blur dark:text-brand-200">
            {item.company_name}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-xs font-medium text-slate-200">{item.company_name}</p>
          <h2 className="mt-1 line-clamp-2 text-h3 text-white">{title}</h2>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-wrap gap-2 text-body-sm font-medium">
          <span className="text-fg-muted">{t('listingCard.locatedIn', { place: location })}</span>
          {beds ? (
            <>
              <span className="text-fg-muted/40">·</span>
              <span>{beds}</span>
            </>
          ) : null}
        </div>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950 dark:text-brand-200"
          aria-hidden
        >
          <ArrowIcon />
        </span>
      </div>
    </Link>
  )
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )
}
