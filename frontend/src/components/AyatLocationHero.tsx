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
      <nav className="mb-7 text-sm text-fg-muted">
        <Link to={backTo} className="font-medium text-brand-700 transition hover:underline dark:text-brand-300">
          ← {backLabel}
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,44%)] lg:items-stretch lg:gap-12 xl:gap-14">
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

          <h1 className="text-h1 mt-5 lg:leading-[1.08]">{pageTitle}</h1>

          {subtitle ? (
            <p className="mt-3 text-lg font-medium text-fg-muted sm:text-xl">{subtitle}</p>
          ) : null}

          {description ? (
            <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted">{description}</p>
          ) : null}

          {layoutCount > 0 ? (
            <ul className="mt-8 flex flex-wrap gap-3">
              <li className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg">
                <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden />
                {layoutCountLabel || `${layoutCount} layouts`}
              </li>
              <li>
                <a
                  href="#location-layouts"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 dark:bg-white dark:text-slate-950 dark:hover:bg-brand-500 dark:hover:text-white"
                >
                  {viewLayoutsLabel}
                  <span aria-hidden>↓</span>
                </a>
              </li>
            </ul>
          ) : null}
        </div>

        <div id="location-video" className="scroll-mt-28">
          {videoUrl ? (
            <HeroLocationVideo url={videoUrl} title={pageTitle} badgeLabel={videoBadgeLabel} />
          ) : coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt=""
              className="h-full min-h-[220px] w-full rounded-[1.5rem] border border-border object-cover shadow-[0_24px_56px_-28px_rgba(15,23,42,0.28)] sm:min-h-[280px] lg:min-h-[340px]"
            />
          ) : (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-border bg-gradient-to-br from-slate-100 to-brand-50 p-8 dark:from-slate-900 dark:to-brand-950/40 sm:min-h-[280px]">
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
