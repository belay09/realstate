import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, useParams } from 'react-router-dom'

import { api } from '../api/client'
import type { PublicCompany } from '../api/types'
import { PartnerLogo } from '../components/PartnerLogo'
import { AYAT_PARTNER, TEMER_PARTNER, partnerForSlug } from '../content/partners'
import { SITE_CONTACT, siteWhatsAppHref } from '../content/siteContact'
import { useTranslation } from '../context/LocaleContext'
import { usePageSeo } from '../hooks/usePageSeo'
import { developerResidentialPath, developerShopsPath } from '../lib/developerRoutes'

const ACCENT = {
  [AYAT_PARTNER.slug]: {
    blob: 'from-red-950/10 via-transparent to-brand-500/5',
    chip: 'text-red-900/80 dark:text-red-200/90',
    bar: 'bg-red-900/70',
  },
  [TEMER_PARTNER.slug]: {
    blob: 'from-emerald-950/10 via-transparent to-emerald-500/5',
    chip: 'text-emerald-900/80 dark:text-emerald-200/90',
    bar: 'bg-emerald-700/70',
  },
  default: {
    blob: 'from-brand-950/10 via-transparent to-brand-500/5',
    chip: 'text-brand-800 dark:text-brand-200',
    bar: 'bg-brand-600/70',
  },
} as const

const KIND_IMAGES = {
  residential: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80',
  shops: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
} as const

export function DeveloperKindPage() {
  const { companySlug: companySlugParam } = useParams<{ companySlug: string }>()
  const companySlug = companySlugParam ? decodeURIComponent(companySlugParam) : null
  const { t } = useTranslation()

  const companies = useQuery({
    queryKey: ['public', 'companies'],
    queryFn: async () => {
      const { data } = await api.get<PublicCompany[]>('/public/companies')
      return data
    },
    staleTime: 60_000,
    enabled: Boolean(companySlug),
  })

  const company = companies.data?.find((c) => c.slug === companySlug) ?? null
  const partner = partnerForSlug(companySlug)
  const brandName = company?.name ?? partner?.brandName ?? null
  const logoUrl = company?.logo_url ?? partner?.logoUrl ?? null

  usePageSeo({
    title: brandName
      ? t('pageTitles.developerKind', { brand: brandName })
      : t('pageTitles.home'),
    description: brandName
      ? t('seo.developerKindDescription', { brand: brandName })
      : t('seo.homeDescription'),
    path: companySlug ? `/developers/${companySlug}` : '/',
  })

  if (!companySlug) {
    return <Navigate to="/" replace />
  }

  if (companies.isLoading) {
    return (
      <div className="space-y-10 text-left">
        <div className="h-28 animate-pulse rounded-2xl bg-surface-muted" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-[1.75rem] bg-surface-muted" />
          <div className="h-80 animate-pulse rounded-[1.75rem] bg-surface-muted" />
        </div>
      </div>
    )
  }

  if (companies.isError || !company) {
    return <Navigate to="/" replace />
  }

  const displayName = company.name
  const accent = ACCENT[companySlug as keyof typeof ACCENT] ?? ACCENT.default
  const residentialTo = developerResidentialPath(companySlug)
  const shopsTo = developerShopsPath(companySlug)

  return (
    <div className="space-y-12 text-left lg:space-y-14">
      <header className="relative animate-fade-in">
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br blur-3xl ${accent.blob}`}
          aria-hidden
        />
        <Link
          to="/"
          className="relative text-sm font-semibold text-brand-700 transition hover:underline dark:text-brand-300"
        >
          {t('developer.backHome')}
        </Link>
        <div className="relative mt-6 flex min-w-0 items-start gap-4 sm:mt-8 sm:gap-6">
          <PartnerLogo
            companySlug={companySlug}
            companyName={displayName}
            logoUrl={logoUrl}
            size="lg"
            className={`shrink-0 shadow-md ring-4 ring-white dark:ring-slate-900 ${
              companySlug === TEMER_PARTNER.slug
                ? 'h-20 w-28 object-contain sm:h-28 sm:w-36'
                : 'h-20 w-20 sm:h-28 sm:w-28'
            }`}
          />
          <div className="min-w-0 pt-1">
            <div className={`mb-3 h-1 w-10 rounded-full sm:mb-4 ${accent.bar}`} aria-hidden />
            <p className="text-eyebrow">{t('developer.heroEyebrow')}</p>
            <h1 className="text-h1 mt-2 sm:mt-3">{displayName}</h1>
            <p className="text-lead mt-3 max-w-xl sm:mt-4">{t('developer.heroBody', { brand: displayName })}</p>
            {company.description ? (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-muted">{company.description}</p>
            ) : null}
            <p className={`mt-4 text-sm font-semibold ${accent.chip}`}>{t('developer.chooseKindHint')}</p>
          </div>
        </div>
      </header>

      <ul className="grid gap-5 sm:gap-6 lg:grid-cols-2 lg:gap-8">
        <li className="animate-fade-in" style={{ animationDelay: '80ms' }}>
          <KindCard
            to={residentialTo}
            image={KIND_IMAGES.residential}
            eyebrow={t('developer.kindResidentialEyebrow')}
            title={t('developer.kindResidential')}
            body={t('developer.kindResidentialBody')}
            cta={t('developer.browseResidential')}
            primary
          />
        </li>
        <li className="animate-fade-in" style={{ animationDelay: '160ms' }}>
          <KindCard
            to={shopsTo}
            image={KIND_IMAGES.shops}
            eyebrow={t('developer.kindShopsEyebrow')}
            title={t('developer.kindShops')}
            body={t('developer.kindShopsBody')}
            cta={t('developer.browseShops')}
          />
        </li>
      </ul>

      <section className="flex flex-col gap-5 border-t border-border pt-8 sm:pt-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-fg">{t('contact.regionLabel')}</p>
          <p className="mt-1 text-body-sm text-fg-muted">{t('developer.contactHint')}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <a href={SITE_CONTACT.telHref} className="btn-primary w-full justify-center sm:w-auto">
            {t('contact.call')} · {SITE_CONTACT.phoneDisplay}
          </a>
          <a
            href={siteWhatsAppHref(t('developer.whatsappPrefill', { brand: displayName }))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full justify-center sm:w-auto"
          >
            {t('contact.whatsapp')}
          </a>
        </div>
      </section>
    </div>
  )
}

function KindCard({
  to,
  image,
  eyebrow,
  title,
  body,
  cta,
  primary = false,
}: {
  to: string
  image: string
  eyebrow: string
  title: string
  body: string
  cta: string
  primary?: boolean
}) {
  return (
    <Link
      to={to}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border bg-surface transition duration-500 hover:-translate-y-1 hover:border-brand-400/45 hover:shadow-[0_28px_64px_-32px_rgba(15,23,42,0.22)] dark:hover:border-brand-600/35"
    >
      <div className="aspect-[16/10] overflow-hidden bg-surface-muted">
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-8">
        <p className="text-eyebrow">{eyebrow}</p>
        <h2 className="text-h2 mt-3">{title}</h2>
        <p className="mt-3 text-body-sm text-fg-muted">{body}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-fg transition group-hover:gap-3 sm:mt-8">
          {cta}
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              primary
                ? 'bg-slate-950 text-white group-hover:bg-brand-600 dark:bg-white dark:text-slate-950 dark:group-hover:bg-brand-500 dark:group-hover:text-white'
                : 'border border-border bg-surface text-fg group-hover:border-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </span>
      </div>
    </Link>
  )
}
