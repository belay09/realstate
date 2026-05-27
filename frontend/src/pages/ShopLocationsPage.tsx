import { Link } from 'react-router-dom'

import { ShopLocationCard } from '../components/ShopLocationCard'
import { useTranslation } from '../context/LocaleContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { getShopLocations } from '../lib/shopLocations'

export function ShopLocationsPage() {
  const { t } = useTranslation()
  usePageTitle(t('pageTitles.shops'))
  const locations = getShopLocations()

  return (
    <div className="space-y-10 text-left">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-brand-900 to-brand-950 px-6 py-12 sm:px-10 sm:py-14">
        <div className="relative max-w-2xl">
          <p className="text-eyebrow text-brand-200">{t('shops.heroEyebrow')}</p>
          <h1 className="mt-3 text-h1 text-white">{t('shops.heroTitle')}</h1>
          <p className="mt-4 text-body-sm text-slate-100/90 sm:text-base">{t('shops.heroBody')}</p>
        </div>
      </section>

      <p className="text-body-sm text-fg-muted">{t('shops.pickLocation')}</p>

      <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc) => (
          <li key={loc.id} className="animate-fade-in">
            <ShopLocationCard location={loc} />
          </li>
        ))}
      </ul>

      <div className="surface border-brand-200/60 bg-brand-50/50 p-5 dark:border-brand-800/40 dark:bg-brand-950/30">
        <p className="text-sm text-fg-muted">{t('shops.calculatorNote')}</p>
        <Link to="/calculator?kind=shop" className="btn-primary mt-4 inline-flex">
          {t('shops.openCalculator')}
        </Link>
      </div>
    </div>
  )
}
