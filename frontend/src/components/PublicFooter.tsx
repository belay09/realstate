import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { PartnerLogo } from './PartnerLogo'
import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import { SITE_CONTACT, siteWhatsAppHref } from '../content/siteContact'

type PublicFooterProps = {
  brandName: string
  adminPath: string
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="footer-link group inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
      <span className="h-px w-0 bg-brand-400 transition-all group-hover:w-3" aria-hidden />
      {children}
    </Link>
  )
}

function FooterExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="footer-link group inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
    >
      <span className="h-px w-0 bg-brand-400 transition-all group-hover:w-3" aria-hidden />
      {children}
    </a>
  )
}

export function PublicFooter({ brandName, adminPath }: PublicFooterProps) {
  const { t } = useTranslation()

  return (
    <footer className="site-footer relative mt-auto overflow-hidden bg-slate-950 pb-28 text-slate-300">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/8 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-[90rem] px-4 pt-16 sm:px-8 sm:pt-20">
        {/* Contact hero band */}
        <div className="footer-contact-hero relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 p-8 sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.15),transparent_60%)]" aria-hidden />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-300">
                {t('footer.contact')}
              </p>
              <a
                href={SITE_CONTACT.telHref}
                className="mt-3 block text-4xl font-bold tracking-tight text-white transition hover:text-brand-200 sm:text-5xl"
              >
                {SITE_CONTACT.phoneDisplay}
              </a>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">{t('footer.contactHint')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={SITE_CONTACT.telHref}
                className="btn-luxury-light py-2.5 pl-6 pr-1.5 text-sm normal-case tracking-normal"
              >
                <span>{t('contact.call')}</span>
                <span className="btn-luxury-icon h-9 w-9 bg-slate-950 text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </a>
              <a
                href={siteWhatsAppHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                {t('contact.whatsapp')}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Link to="/" className="group inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-lg font-bold text-white shadow-lg transition group-hover:scale-105">
                B
              </span>
              <span className="text-2xl font-bold text-white">{brandName}</span>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
              {t('footer.description', {
                ayatBrand: AYAT_PARTNER.brandName,
                temerBrand: TEMER_PARTNER.brandName,
              })}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <PartnerLogo companySlug={AYAT_PARTNER.slug} size="sm" className="ring-2 ring-white/10" />
              <PartnerLogo companySlug={TEMER_PARTNER.slug} size="sm" className="ring-2 ring-white/10" />
            </div>
          </div>

          {/* Explore */}
          <div className="lg:col-span-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-300">{t('footer.explore')}</p>
            <ul className="mt-5 space-y-3">
              <li><FooterLink to="/apartments">{t('footer.apartments')}</FooterLink></li>
              <li><FooterLink to="/shops">{t('footer.shops')}</FooterLink></li>
              <li><FooterLink to="/calculator">{t('footer.calculator')}</FooterLink></li>
              <li>
                <FooterLink to={`/apartments?company_slug=${AYAT_PARTNER.slug}`}>
                  {t('footer.ayatHomes')}
                </FooterLink>
              </li>
              <li>
                <FooterLink to={`/apartments?company_slug=${TEMER_PARTNER.slug}`}>
                  {t('footer.temerHomes')}
                </FooterLink>
              </li>
            </ul>
          </div>

          {/* Partners + staff */}
          <div className="lg:col-span-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-300">{t('footer.partners')}</p>
            <ul className="mt-5 space-y-3">
              <li>
                <FooterExternalLink href={AYAT_PARTNER.website}>{t('footer.officialAyat')}</FooterExternalLink>
              </li>
              <li>
                <FooterExternalLink href={TEMER_PARTNER.website}>{t('footer.officialTemer')}</FooterExternalLink>
              </li>
              <li>
                <FooterLink to={adminPath}>{t('nav.staff')}</FooterLink>
              </li>
            </ul>
            <Link
              to="/apartments"
              className="btn-luxury mt-8 inline-flex py-2 pl-5 pr-1.5 text-xs normal-case tracking-normal"
            >
              <span>{t('nav.browseHomes')}</span>
              <span className="btn-luxury-icon h-8 w-8">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 sm:flex-row">
          <p className="text-center text-xs text-slate-500 sm:text-left">
            © {new Date().getFullYear()} {brandName} · {t('footer.copyright')}
          </p>
          <p className="text-xs text-slate-600">{t('footer.tagline')}</p>
        </div>
      </div>
    </footer>
  )
}
