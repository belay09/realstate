import { Link } from 'react-router-dom'

import { HeroLocationVideo } from './HeroLocationVideo'
import { PartnerLogo } from './PartnerLogo'
import { AYAT_PARTNER } from '../content/partners'

type AyatLocationHeroProps = {
  backLabel: string
  backTo: string
  pageTitle: string
  subtitle: string | null
  description: string | null
  coverImageUrl: string | null
  videoUrl?: string | null
  developerLabel: string
  layoutCount?: number
  layoutCountLabel?: string
  viewLayoutsLabel?: string
  videoBadgeLabel?: string
}

export function AyatLocationHero({
  backLabel,
  backTo,
  pageTitle,
  subtitle,
  description,
  coverImageUrl,
  videoUrl,
  developerLabel,
  layoutCount = 0,
  layoutCountLabel = '',
  viewLayoutsLabel = 'View layouts',
  videoBadgeLabel = 'Site tour',
}: AyatLocationHeroProps) {
  return (
    <header className="animate-fade-in">
      <nav className="mb-6 text-sm text-fg-muted">
        <Link to={backTo} className="font-medium text-brand-700 transition hover:underline dark:text-brand-300">
          ← {backLabel}
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,46%)] lg:items-stretch lg:gap-12">
        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-3">
            <PartnerLogo
              companySlug={AYAT_PARTNER.slug}
              companyName={AYAT_PARTNER.brandName}
              size="sm"
              className="border-border shadow-sm"
            />
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
              {developerLabel}
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            {pageTitle}
          </h1>

          {subtitle ? (
            <p className="mt-2 text-xl font-medium text-fg-muted">{subtitle}</p>
          ) : null}

          {description ? (
            <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted">{description}</p>
          ) : null}

          {layoutCount > 0 ? (
            <ul className="mt-8 flex flex-wrap gap-3">
              <li className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                {layoutCountLabel || `${layoutCount} layouts`}
              </li>
              <li>
                <a
                  href="#location-layouts"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-900/20 transition hover:bg-brand-700"
                >
                  {viewLayoutsLabel}
                  <span aria-hidden>↓</span>
                </a>
              </li>
            </ul>
          ) : null}
        </div>

        <div id="location-video" className="scroll-mt-28 lg:row-span-1">
          {videoUrl ? (
            <HeroLocationVideo url={videoUrl} title={pageTitle} badgeLabel={videoBadgeLabel} />
          ) : coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt=""
              className="h-full min-h-[240px] w-full rounded-2xl border border-border object-cover shadow-lg transition duration-700 hover:scale-[1.02] sm:min-h-[280px] lg:min-h-[320px]"
            />
          ) : (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-gradient-to-br from-brand-50 to-slate-100 p-8 shadow-lg dark:from-brand-950/40 dark:to-slate-900 sm:min-h-[280px]">
              <PartnerLogo
                companySlug={AYAT_PARTNER.slug}
                companyName={AYAT_PARTNER.brandName}
                size="lg"
              />
              <p className="text-center text-sm font-medium text-fg-muted">Photos coming soon</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
