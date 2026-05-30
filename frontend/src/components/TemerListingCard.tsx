import { Link } from 'react-router-dom'

import type { PublicListingSummary } from '../api/types'
import { SITE_CONTACT, siteWhatsAppHref } from '../content/siteContact'
import { useTranslation } from '../context/LocaleContext'
import { formatListingLocation } from '../lib/listingDisplay'

type TemerListingCardProps = {
  listing: PublicListingSummary
}

function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-50">{value}</dd>
    </div>
  )
}

export function TemerListingCard({ listing }: TemerListingCardProps) {
  const { t } = useTranslation()
  const detailHref = `/listings/${listing.slug}`
  const imageUrl = listing.cover_image_url ?? listing.primary_image_url
  const location = formatListingLocation(listing, t)
  const waMessage = t('listingDetail.interestedIn', { title: listing.title })

  const beds =
    listing.bedrooms != null
      ? String(listing.bedrooms)
      : t('temerCard.specDash')
  const baths = listing.bathrooms ?? t('temerCard.specDash')
  const size = listing.property_size ?? t('temerCard.specDash')

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-16px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-950">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            {t('listingCard.photoSoon')}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-transparent to-transparent" />
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white shadow-sm">
            {t('listingCard.forSale')}
          </span>
        </div>
        <Link to={detailHref} className="absolute inset-0 z-[1]" aria-label={listing.title}>
          <span className="sr-only">{listing.title}</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold leading-snug text-slate-900 dark:text-slate-50">
          <Link to={detailHref} className="hover:text-emerald-700 dark:hover:text-emerald-400">
            {listing.title}
          </Link>
        </h3>

        {listing.description_preview ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {listing.description_preview}
          </p>
        ) : null}

        <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-4 dark:border-slate-800">
          <SpecCell label={t('temerCard.beds')} value={beds} />
          <SpecCell label={t('temerCard.baths')} value={baths} />
          <SpecCell label={t('temerCard.size')} value={size} />
        </dl>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{location}</p>

        <div className="mt-auto flex gap-2 pt-5">
          <a
            href={SITE_CONTACT.telHref}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100 dark:hover:bg-emerald-900"
          >
            <PhoneIcon className="h-4 w-4 shrink-0" />
            {t('contact.call')}
          </a>
          <Link
            to={detailHref}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100 dark:hover:bg-emerald-900"
          >
            <CalendarIcon className="h-4 w-4 shrink-0" />
            {t('temerCard.viewDetails')}
          </Link>
          <a
            href={siteWhatsAppHref(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-sm transition hover:brightness-110"
            aria-label={t('contact.whatsapp')}
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </article>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
