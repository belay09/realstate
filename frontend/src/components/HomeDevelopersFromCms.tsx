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

/** Soft priority for known partners — does not hardcode which companies exist. */
const SLUG_PRIORITY = [AYAT_PARTNER.slug, TEMER_PARTNER.slug] as const

const ACCENT_BY_SLUG: Record<string, { blob: string; line: string }> = {
  [AYAT_PARTNER.slug]: {
    blob: 'from-red-950/8 via-transparent to-brand-500/5',
    line: 'bg-red-900/70',
  },
  [TEMER_PARTNER.slug]: {
    blob: 'from-emerald-950/8 via-transparent to-emerald-500/5',
    line: 'bg-emerald-700/70',
  },
}

const DEFAULT_ACCENT = {
  blob: 'from-brand-500/10 via-transparent to-brand-700/5',
  line: 'bg-brand-600/70',
}

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
    <div className="space-y-0" aria-hidden>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="border-t border-border py-16 sm:py-20">
          <div className="mx-auto grid max-w-[90rem] gap-12 px-4 sm:px-8 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-5">
              <div className="h-1 w-12 animate-pulse rounded-full bg-surface-muted" />
              <div className="flex items-start gap-5">
                <div className="h-28 w-28 animate-pulse rounded-2xl bg-surface-muted sm:h-32 sm:w-32" />
                <div className="mt-3 h-10 w-48 animate-pulse rounded bg-surface-muted" />
              </div>
              <div className="h-24 max-w-xl animate-pulse rounded bg-surface-muted" />
              <div className="h-12 w-40 animate-pulse rounded-full bg-surface-muted" />
            </div>
            <div className="aspect-[4/5] animate-pulse rounded-[2rem] bg-surface-muted sm:aspect-[5/6] sm:rounded-[2.5rem]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DeveloperBand({
  company,
  reverse,
  index,
}: {
  company: PublicCompany
  reverse: boolean
  index: number
}) {
  const { t } = useTranslation()
  const accent = ACCENT_BY_SLUG[company.slug] ?? DEFAULT_ACCENT
  const description =
    company.description?.trim() || t('home.developersCardFallbackDescription', { name: company.name })
  const browseTo = developerKindPath(company.slug)
  const browseLabel = t('home.developersCta', { name: company.name })
  const isTemer = company.slug === TEMER_PARTNER.slug

  return (
    <article
      className="developer-showcase group relative overflow-hidden border-t border-border py-14 sm:py-20 lg:py-24"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div
        className={`pointer-events-none absolute -top-24 h-80 w-80 rounded-full bg-gradient-to-br blur-3xl ${accent.blob} ${
          reverse ? '-left-24' : '-right-24'
        }`}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[90rem] px-4 sm:px-8">
        <div
          className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20 ${
            reverse ? 'lg:[&>*:first-child]:order-2' : ''
          }`}
        >
          <div className="min-w-0">
            <div className={`mb-6 h-1 w-12 rounded-full ${accent.line}`} aria-hidden />
            <p className="section-eyebrow">{t('developer.heroEyebrow')}</p>

            <div className="mt-6 flex items-start gap-4 sm:gap-6">
              <div className="developer-showcase-logo shrink-0">
                <PartnerLogo
                  companySlug={company.slug}
                  companyName={company.name}
                  logoUrl={company.logo_url}
                  size="lg"
                  className={`shadow-lg ring-4 ring-white dark:ring-slate-900 ${
                    isTemer
                      ? 'h-24 w-32 object-contain sm:h-32 sm:w-40'
                      : 'h-24 w-24 sm:h-32 sm:w-32'
                  }`}
                />
              </div>
              <div className="min-w-0 pt-1">
                <h3 className="text-h1 leading-tight">{company.name}</h3>
              </div>
            </div>

            <p className="text-lead mt-6 max-w-xl">{description}</p>

            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
              <ButtonArrow to={browseTo} className="w-full justify-between sm:w-auto">
                {browseLabel}
              </ButtonArrow>
            </div>
          </div>

          <Link
            to={browseTo}
            className="developer-showcase-visual relative block overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]"
            aria-label={browseLabel}
          >
            <div
              className={`relative flex aspect-[4/5] items-center justify-center overflow-hidden sm:aspect-[5/6] ${
                company.slug === AYAT_PARTNER.slug
                  ? 'bg-gradient-to-br from-red-950 via-slate-900 to-brand-950'
                  : company.slug === TEMER_PARTNER.slug
                    ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900'
                    : 'bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950'
              }`}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.14),transparent_55%)]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl"
                aria-hidden
              />
              <PartnerLogo
                companySlug={company.slug}
                companyName={company.name}
                logoUrl={company.logo_url}
                size="lg"
                className={`relative z-[1] !h-36 !w-36 !rounded-3xl !border-0 !bg-white/95 !p-3 shadow-2xl sm:!h-44 sm:!w-44 ${
                  isTemer ? '!w-52 sm:!w-60' : ''
                }`}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                {t('developer.heroEyebrow')}
              </p>
              <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">{company.name}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition group-hover:gap-3">
                {browseLabel}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-950">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </span>
            </div>
          </Link>
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
    <div className="mx-auto max-w-[90rem] px-4 py-16 sm:px-8 sm:py-20">
      <div className="max-w-xl border-t border-border pt-10">
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
      <div className="mx-auto max-w-[90rem] px-4 pb-2 pt-16 sm:px-8 sm:pt-24">
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
        <div className="pb-16 sm:pb-24">
          {companies.map((company, index) => (
            <DeveloperBand
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
