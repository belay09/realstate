import { Link } from 'react-router-dom'

import { useTranslation } from '../context/LocaleContext'
import { formatBedroomCount } from '../lib/ayatLabels'
import type { ProjectListingGroup } from '../lib/groupListingsByProject'
import { formatListingLocation, resolveDevelopmentZone } from '../lib/listingDisplay'
import { isCardImageUsable } from '../lib/listingCardImage'
import { CardCoverMedia } from './CardCoverMedia'
import { PartnerLogo } from './PartnerLogo'

type ProjectLocationCardProps = {
  group: ProjectListingGroup
}

function GradientFallbackHeader({
  title,
  subtitle,
  companyName,
  companySlug,
  forSaleLabel,
}: {
  title: string
  subtitle: string | null
  companyName: string
  companySlug: string
  forSaleLabel: string
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-6 py-8 sm:px-7 sm:py-9">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/20 blur-3xl"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
          {forSaleLabel}
        </span>
        <PartnerLogo
          companySlug={companySlug}
          companyName={companyName}
          size="sm"
          className="border-white/20 bg-white/95 shadow-md"
        />
      </div>
      <p className="relative mt-6 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-300">
        {companyName}
      </p>
      <h2 className="relative mt-2 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      {subtitle ? <p className="relative mt-1.5 text-sm text-slate-300">{subtitle}</p> : null}
    </div>
  )
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
  const coverImage = isCardImageUsable(group.primary_image_url) ? group.primary_image_url : null
  const forSaleLabel = t('listingCard.forSale')

  return (
    <Link
      to={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface transition duration-500 hover:-translate-y-1 hover:border-brand-400/50 hover:shadow-[0_24px_56px_-28px_rgba(15,23,42,0.22)] dark:hover:border-brand-600/40"
    >
      {coverImage ? (
        <div className="relative">
          <CardCoverMedia src={coverImage} alt={title} />
          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-4">
            <span className="rounded-full bg-slate-950/80 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
              {forSaleLabel}
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/95 py-1 pl-1 pr-3 shadow-md backdrop-blur-sm">
              <PartnerLogo companySlug={group.company_slug} companyName={group.company_name} size="sm" />
              <span className="max-w-[7rem] truncate text-[0.65rem] font-bold uppercase tracking-wide text-slate-800">
                {group.company_name}
              </span>
            </span>
          </div>
        </div>
      ) : (
        <GradientFallbackHeader
          title={title}
          subtitle={subtitle}
          companyName={group.company_name}
          companySlug={group.company_slug}
          forSaleLabel={forSaleLabel}
        />
      )}

      <div className="flex flex-1 flex-col gap-4 p-6">
        {coverImage ? (
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
              {group.company_name}
            </p>
            <h2 className="mt-1.5 text-h3 leading-snug">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-fg-muted">{subtitle}</p> : null}
          </div>
        ) : null}

        <p className="text-body-sm text-fg-muted">{location}</p>

        {group.bedroomCounts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {group.bedroomCounts.map((n) => (
              <span
                key={n}
                className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-fg"
              >
                {n === 1 || n === 2 || n === 3
                  ? formatBedroomCount(n, t)
                  : t('projectBrowse.bedroomCount', { count: n })}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-sm font-semibold text-fg">
              {homeCount === 1
                ? t('projectBrowse.oneHome')
                : t('projectBrowse.homeCount', { count: homeCount })}
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">{t('projectBrowse.tapForLayouts')}</p>
          </div>
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition duration-300 group-hover:translate-x-0.5 group-hover:bg-brand-600 dark:bg-white dark:text-slate-950 dark:group-hover:bg-brand-500 dark:group-hover:text-white"
            aria-hidden
          >
            <ArrowIcon />
          </span>
        </div>
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
