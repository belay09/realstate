import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../api/client'
import type { PublicCompany } from '../api/types'
import { SITE_CONTACT, siteWhatsAppHref } from '../content/siteContact'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import { useTranslation } from '../context/LocaleContext'
import { developerKindPath } from '../lib/developerRoutes'
import { ButtonArrow } from './ButtonArrow'
import { PartnerLogo } from './PartnerLogo'
import { SectionHeader } from './SectionHeader'

/** Soft priority for known partners - does not hardcode which companies exist. */
const SLUG_PRIORITY = [AYAT_PARTNER.slug, TEMER_PARTNER.slug] as const

const PANEL_TONE: Record<string, string> = {
  [AYAT_PARTNER.slug]:
    'bg-gradient-to-br from-red-950 via-slate-900 to-brand-950 dark:from-red-950 dark:via-slate-950 dark:to-slate-900',
  [TEMER_PARTNER.slug]:
    'bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 dark:from-emerald-950 dark:via-slate-950 dark:to-emerald-950',
}

const DEFAULT_PANEL_TONE =
  'bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800'

function sortCompanies(companies: PublicCompany[]): PublicCompany[] {
  return [...companies].sort((a, b) => {
    const aKnown = SLUG_PRIORITY.indexOf(a.slug as (typeof SLUG_PRIORITY)[number])
    const bKnown = SLUG_PRIORITY.indexOf(b.slug as (typeof SLUG_PRIORITY)[number])
    const aPri = aKnown === -1 ? 100 : aKnown
    const bPri = bKnown === -1 ? 100 : bKnown
    if (aPri !== bPri) return aPri - bPri

    const aRich = a.description?.trim() || a.logo_url ? 0 : 1
    const bRich = b.description?.trim() || b.logo_url ? 0 : 1
    return aRich - bRich
  })
}

function DevelopersSkeleton() {
  return (
    <div className="mx-auto max-w-[90rem] space-y-10 px-4 pb-16 sm:space-y-12 sm:px-8 sm:pb-24" aria-hidden>
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
        >
          <div
            className={`grid min-h-[28rem] lg:min-h-[32rem] lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] ${
              i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
            }`}
          >
            <div className="min-h-[18rem] animate-pulse bg-surface-muted lg:min-h-full" />
            <div className="flex flex-col justify-center gap-5 p-8 sm:p-10 lg:p-14">
              <div className="h-3 w-28 animate-pulse rounded bg-surface-muted" />
              <div className="h-10 w-56 animate-pulse rounded bg-surface-muted sm:w-72" />
              <div className="h-20 max-w-xl animate-pulse rounded bg-surface-muted" />
              <div className="mt-2 h-12 w-44 animate-pulse rounded-full bg-surface-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PartnerVisual({
  company,
  browseTo,
  browseLabel,
}: {
  company: PublicCompany
  browseTo: string
  browseLabel: string
}) {
  const { t } = useTranslation()
  const isTemer = company.slug === TEMER_PARTNER.slug
  const tone = PANEL_TONE[company.slug] ?? DEFAULT_PANEL_TONE

  return (
    <Link
      to={browseTo}
      className="partner-rich-visual relative block min-h-[18rem] overflow-hidden sm:min-h-[22rem] lg:min-h-full"
      aria-label={browseLabel}
    >
      <div className={`absolute inset-0 ${tone}`}>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.14),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
      </div>

      <div className="relative z-[1] flex h-full min-h-[18rem] flex-col items-center justify-center px-8 py-12 sm:min-h-[22rem] lg:min-h-full lg:py-16">
        <PartnerLogo
          companySlug={company.slug}
          companyName={company.name}
          logoUrl={company.logo_url}
          size="lg"
          className={`!rounded-3xl !border-0 !bg-white/95 !p-3 shadow-2xl dark:!bg-white ${
            isTemer
              ? '!h-32 !w-44 sm:!h-40 sm:!w-56'
              : '!h-32 !w-32 sm:!h-40 sm:!w-40'
          }`}
        />
        <p className="mt-8 text-center text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
          {t('developer.heroEyebrow')}
        </p>
        <p className="mt-2 max-w-xs text-center text-xl font-bold text-white sm:text-2xl">
          {company.name}
        </p>
      </div>
    </Link>
  )
}

function DeveloperCard({
  company,
  reverse,
  index,
}: {
  company: PublicCompany
  reverse: boolean
  index: number
}) {
  const { t } = useTranslation()
  const description =
    company.description?.trim() || t('home.developersCardFallbackDescription', { name: company.name })
  const browseTo = developerKindPath(company.slug)
  const browseLabel = t('home.developersCta', { name: company.name })

  return (
    <article
      className="partner-rich-card developer-showcase group overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)] dark:shadow-[0_18px_50px_-28px_rgba(0,0,0,0.55)]"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div
        className={`grid min-h-[28rem] lg:min-h-[32rem] lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] ${
          reverse ? 'lg:[&>*:first-child]:order-2' : ''
        }`}
      >
        <PartnerVisual company={company} browseTo={browseTo} browseLabel={browseLabel} />

        <div className="flex min-w-0 flex-col justify-center px-8 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16 xl:px-16">
          <p className="section-eyebrow">{t('developer.heroEyebrow')}</p>

          <div className="mt-6 flex items-start gap-4 sm:gap-5">
            <div className="developer-showcase-logo shrink-0">
              <PartnerLogo
                companySlug={company.slug}
                companyName={company.name}
                logoUrl={company.logo_url}
                size="md"
                className={`shadow-md ring-4 ring-white dark:ring-slate-900 ${
                  company.slug === TEMER_PARTNER.slug
                    ? '!h-16 !w-24 object-contain sm:!h-20 sm:!w-28'
                    : ''
                }`}
              />
            </div>
            <div className="min-w-0 pt-1">
              <h3 className="text-h1 leading-[1.1]">{company.name}</h3>
            </div>
          </div>

          <p className="text-lead mt-6 max-w-xl text-fg-muted">{description}</p>

          <div className="mt-10">
            <ButtonArrow to={browseTo} className="w-full justify-between sm:w-auto">
              {browseLabel}
            </ButtonArrow>
          </div>
        </div>
      </div>
    </article>
  )
}

function StatusPanel({
  title,
  body,
}: {
  title: string
  body: string
}) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-[90rem] px-4 pb-16 sm:px-8 sm:pb-24">
      <div className="max-w-xl rounded-3xl border border-border bg-surface px-8 py-10 sm:px-10 sm:py-12">
        <p className="text-lg font-semibold text-fg">{title}</p>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{body}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a href={SITE_CONTACT.telHref} className="btn-primary w-full justify-center sm:w-auto">
            {t('contact.call')} · {SITE_CONTACT.phoneDisplay}
          </a>
          <a
            href={siteWhatsAppHref(t('home.developersContactPrefill'))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full justify-center sm:w-auto"
          >
            {t('contact.whatsapp')}
          </a>
        </div>
      </div>
    </div>
  )
}

export function HomeDevelopersFromCms() {
  const { t } = useTranslation()

  const query = useQuery({
    queryKey: ['public', 'companies'],
    queryFn: async () => {
      const { data } = await api.get<PublicCompany[]>('/public/companies')
      return data
    },
    staleTime: 60_000,
  })

  const companies = query.data ? sortCompanies(query.data) : []

  return (
    <section id="developers" className="scroll-mt-28 overflow-hidden">
      <div className="mx-auto max-w-[90rem] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-24">
        <SectionHeader
          eyebrow={t('home.partnersEyebrow')}
          title={t('home.partnersTitle')}
          description={t('home.partnersDescription')}
          large
        />
      </div>

      {query.isLoading ? <DevelopersSkeleton /> : null}

      {query.isError ? (
        <StatusPanel title={t('home.developersErrorTitle')} body={t('home.developersErrorBody')} />
      ) : null}

      {!query.isLoading && !query.isError && companies.length === 0 ? (
        <StatusPanel title={t('home.developersEmptyTitle')} body={t('home.developersEmptyBody')} />
      ) : null}

      {!query.isLoading && !query.isError && companies.length > 0 ? (
        <div className="mx-auto max-w-[90rem] space-y-10 px-4 pb-16 sm:space-y-12 sm:px-8 sm:pb-24">
          {companies.map((company, index) => (
            <DeveloperCard
              key={company.slug}
              company={company}
              reverse={index % 2 === 1}
              index={index}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
