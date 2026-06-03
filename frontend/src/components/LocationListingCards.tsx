import type { PublicListingSummary } from '../api/types'
import { useTranslation } from '../context/LocaleContext'
import {
  formatListingBedrooms,
  formatListingCardTitle,
  formatListingLocation,
  finishKindFromUnitTypeCode,
} from '../lib/listingDisplay'
import { ListingCardImageCarousel } from './ListingCardImageCarousel'
import { LocationPageSection } from './LocationPageSection'
import { ScrollReveal } from './ScrollReveal'

type LocationListingCardsProps = {
  listings: PublicListingSummary[]
  title: string
  subtitle?: string | null
  sectionId?: string
}

function FinishBadge({ code }: { code: string }) {
  const { t } = useTranslation()
  const finish = finishKindFromUnitTypeCode(code)
  if (!finish) return null
  const label =
    finish === 'regular-finished'
      ? t('listingCard.regularFinished')
      : t('listingCard.semiFinished')
  const isRegular = finish === 'regular-finished'
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide backdrop-blur-sm ${
        isRegular
          ? 'bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/30'
          : 'bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/30'
      }`}
    >
      {label}
    </span>
  )
}

function LayoutCard({ item, index }: { item: PublicListingSummary; index: number }) {
  const { t } = useTranslation()
  const title = formatListingCardTitle(item, t)
  const beds = formatListingBedrooms(item, t)
  const location = formatListingLocation(item, t)
  const imageUrls =
    item.image_urls && item.image_urls.length > 0
      ? item.image_urls
      : item.primary_image_url
        ? [item.primary_image_url]
        : []

  return (
    <ScrollReveal animation="scale" delayMs={index * 140}>
      <article className="location-card-shine group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-md transition duration-500 hover:-translate-y-2 hover:border-brand-400/50 hover:shadow-[0_28px_56px_-16px_rgba(2,132,199,0.35)] dark:hover:border-brand-600/40">
        <div className="group/image relative aspect-[5/4] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
          <div className="h-full w-full transition duration-700 ease-out group-hover/image:scale-[1.02]">
            {imageUrls.length > 0 ? (
              <ListingCardImageCarousel urls={imageUrls} alt={title} startOffset={index} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                <PhotoPlaceholderIcon />
                <span className="text-xs font-medium">{t('listingCard.photoSoon')}</span>
              </div>
            )}
          </div>
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          <div className="absolute left-3 right-3 top-3 z-[2] flex flex-wrap items-center gap-2 pr-16">
            {beds ? (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-brand-900 shadow-lg">
                {beds}
              </span>
            ) : null}
            <FinishBadge code={item.unit_type_code} />
          </div>
          <div className="absolute bottom-3 left-3 right-3 z-[2] translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="inline-block rounded-lg bg-brand-600/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
              View details →
            </span>
          </div>
        </div>
        <div className="relative flex flex-1 flex-col p-5 sm:p-6">
          <div
            className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent opacity-0 transition group-hover:opacity-100"
            aria-hidden
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            {location}
          </p>
          <h3 className="mt-2 line-clamp-2 text-xl font-bold leading-snug tracking-tight text-fg">
            {title}
          </h3>
          {item.description_preview ? (
            <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-fg-muted">
              {item.description_preview}
            </p>
          ) : null}
        </div>
      </article>
    </ScrollReveal>
  )
}

export function LocationListingCards({
  listings,
  title,
  subtitle,
  sectionId = 'location-layouts',
}: LocationListingCardsProps) {
  const visible = listings.filter((l) => l.title?.trim())
  if (visible.length === 0) return null

  return (
    <LocationPageSection id={sectionId} title={title} description={subtitle ?? undefined}>
      <ul
        className={`grid gap-6 ${
          visible.length === 1 ? 'max-w-xl' : visible.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {visible.map((item, index) => (
          <li key={item.slug}>
            <LayoutCard item={item} index={index} />
          </li>
        ))}
      </ul>
    </LocationPageSection>
  )
}

function PhotoPlaceholderIcon() {
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
