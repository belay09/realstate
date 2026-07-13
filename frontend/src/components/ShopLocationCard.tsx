import { Link } from 'react-router-dom'

import { useTranslation } from '../context/LocaleContext'
import { formatShopFloorLabel } from '../lib/ayatLabels'
import type { ShopLocationSummary } from '../lib/shopLocations'
import { shopFloorKeys, shopLocationTitle } from '../lib/shopLocations'
import { CardCoverMedia } from './CardCoverMedia'

type ShopLocationCardProps = {
  location: ShopLocationSummary
}

export function ShopLocationCard({ location }: ShopLocationCardProps) {
  const { t } = useTranslation()
  const title = shopLocationTitle(location, t)
  const floors = shopFloorKeys(location)
  const forSaleLabel = t('listingCard.forSale')

  return (
    <Link
      to={`/shops/${location.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface transition duration-500 hover:-translate-y-1 hover:border-brand-400/50 hover:shadow-[0_24px_56px_-28px_rgba(15,23,42,0.22)] dark:hover:border-brand-600/40"
    >
      {location.coverImageUrl ? (
        <div className="relative">
          <CardCoverMedia src={location.coverImageUrl} alt={title} />
          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-4">
            <span className="rounded-full bg-slate-950/80 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
              {t('shops.commercial')}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-6 py-8 sm:px-7 sm:py-9">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/20 blur-3xl"
            aria-hidden
          />
          <span className="relative rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
            {forSaleLabel}
          </span>
          <p className="relative mt-6 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-300">
            {t('shops.developer')}
          </p>
          <h2 className="relative mt-2 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-6">
        {location.coverImageUrl ? (
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
              {t('shops.developer')}
            </p>
            <h2 className="mt-1.5 text-h3 leading-snug">{title}</h2>
          </div>
        ) : null}

        {floors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {floors.map((f) => (
              <span
                key={f}
                className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-fg"
              >
                {formatShopFloorLabel(f, t)}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm font-semibold text-fg">{t('shops.tapForDetails')}</p>
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition duration-300 group-hover:translate-x-0.5 group-hover:bg-brand-600 dark:bg-white dark:text-slate-950 dark:group-hover:bg-brand-500 dark:group-hover:text-white"
            aria-hidden
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}
