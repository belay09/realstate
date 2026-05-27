import { Link } from 'react-router-dom'

import { useTranslation } from '../context/LocaleContext'
import { formatBedroomCount } from '../lib/ayatLabels'
import type { ProjectListingGroup } from '../lib/groupListingsByProject'
import { formatListingLocation, resolveDevelopmentZone } from '../lib/listingDisplay'

type ProjectLocationCardProps = {
  group: ProjectListingGroup
}

export function ProjectLocationCard({ group }: ProjectLocationCardProps) {
  const { t } = useTranslation()
  const zone = resolveDevelopmentZone(group.project_slug, group.area)
  const location = formatListingLocation(group.listings[0], t)
  const title = zone || group.project_name
  const subtitle =
    group.project_name && zone && group.project_name !== zone ? group.project_name : null
  const homeCount = group.listings.length
  const href = `/apartments/${group.project_slug}`

  return (
    <Link
      to={href}
      className="group surface relative flex h-full flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(2,132,199,0.25)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
        {group.primary_image_url ? (
          <img
            src={group.primary_image_url}
            alt=""
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-body-sm">
            {t('listingCard.photoSoon')}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
          <span className="badge-sale">{t('listingCard.forSale')}</span>
          <span className="max-w-[55%] truncate rounded-full bg-surface/95 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-brand-800 shadow backdrop-blur dark:text-brand-200">
            {group.company_name}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-xs font-medium text-slate-200">{group.company_name}</p>
          <h2 className="mt-1 text-h3 text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-300">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        <p className="text-body-sm text-fg-muted">{location}</p>
        {group.bedroomCounts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {group.bedroomCounts.map((n) => (
              <span
                key={n}
                className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200"
              >
                {n === 1 || n === 2 || n === 3
                  ? formatBedroomCount(n, t)
                  : t('projectBrowse.bedroomCount', { count: n })}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-fg">
            {homeCount === 1
              ? t('projectBrowse.oneHome')
              : t('projectBrowse.homeCount', { count: homeCount })}
          </p>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950 dark:text-brand-200"
            aria-hidden
          >
            <ArrowIcon />
          </span>
        </div>
        <p className="text-xs text-fg-muted">{t('projectBrowse.tapForLayouts')}</p>
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
