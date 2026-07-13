import { Link } from 'react-router-dom'

import { useTranslation } from '../context/LocaleContext'
import { developerResidentialPath, developerShopsPath } from '../lib/developerRoutes'

type ProductKind = 'residential' | 'shops'

type ProductKindSwitcherProps = {
  companySlug: string
  active: ProductKind
  className?: string
}

export function ProductKindSwitcher({ companySlug, active, className = '' }: ProductKindSwitcherProps) {
  const { t } = useTranslation()

  const tabs: { kind: ProductKind; to: string; label: string }[] = [
    {
      kind: 'residential',
      to: developerResidentialPath(companySlug),
      label: t('developer.kindResidential'),
    },
    {
      kind: 'shops',
      to: developerShopsPath(companySlug),
      label: t('developer.kindShops'),
    },
  ]

  return (
    <div
      className={`flex w-full rounded-full border border-border bg-surface-muted/60 p-1 shadow-sm sm:inline-flex sm:w-auto ${className}`.trim()}
      role="tablist"
      aria-label={t('developer.kindSwitcherLabel')}
    >
      {tabs.map((tab) => {
        const isActive = tab.kind === active
        return (
          <Link
            key={tab.kind}
            to={tab.to}
            role="tab"
            aria-selected={isActive}
            className={`flex-1 rounded-full px-3 py-2 text-center text-sm font-semibold transition sm:flex-none sm:px-4 ${
              isActive
                ? 'bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
