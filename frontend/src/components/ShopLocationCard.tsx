import { Link } from 'react-router-dom'

import { useTranslation } from '../context/LocaleContext'
import { formatShopFloorLabel } from '../lib/ayatLabels'
import type { ShopLocationSummary } from '../lib/shopLocations'
import { shopFloorKeys } from '../lib/shopLocations'

type ShopLocationCardProps = {
  location: ShopLocationSummary
}

export function ShopLocationCard({ location }: ShopLocationCardProps) {
  const { t } = useTranslation()
  const title = t(location.labelKey as Parameters<typeof t>[0])
  const floors = shopFloorKeys(location)

  return (
    <Link
      to={`/shops/${location.id}`}
      className="group surface relative flex h-full flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(2,132,199,0.25)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-slate-800 via-brand-900 to-brand-950">
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-200/90">
            {t('shops.commercial')}
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-xs font-medium text-slate-200">{t('shops.developer')}</p>
          <h2 className="mt-1 text-h3 text-white">{title}</h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {floors.map((f) => (
            <span
              key={f}
              className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200"
            >
              {formatShopFloorLabel(f, t)}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-fg">{t('shops.tapForDetails')}</p>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950 dark:text-brand-200"
            aria-hidden
          >
            →
          </span>
        </div>
      </div>
    </Link>
  )
}
