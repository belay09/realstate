import { SITE_CONTACT, siteWhatsAppHref } from '../content/siteContact'
import { useTranslation } from '../context/LocaleContext'

function PhoneIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  )
}

export function SiteContactStrip() {
  const { t } = useTranslation()

  return (
    <div
      className="site-contact-strip fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950 px-4 py-3 shadow-[0_-8px_40px_rgba(0,0,0,0.35)] sm:py-3.5"
      role="region"
      aria-label={t('contact.regionLabel')}
    >
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-center gap-4 sm:justify-between sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-900/40">
            <PhoneIcon />
          </span>
          <div className="text-left">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-brand-300">
              {t('contact.label')}
            </p>
            <a
              href={SITE_CONTACT.telHref}
              className="mt-0.5 block text-lg font-bold text-white transition hover:text-brand-200 sm:text-xl"
            >
              {SITE_CONTACT.phoneDisplay}
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href={SITE_CONTACT.telHref}
            className="btn-luxury-light py-2 pl-5 pr-1.5 text-xs normal-case tracking-normal sm:text-sm"
          >
            <span>{t('contact.call')}</span>
            <span className="btn-luxury-icon h-8 w-8 bg-slate-950 text-white">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </a>
          <a
            href={siteWhatsAppHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:text-sm"
          >
            {t('contact.whatsapp')}
          </a>
        </div>
      </div>
    </div>
  )
}

export function SiteContactBanner({ className = '' }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-brand-950 px-5 py-4 shadow-lg sm:px-6 sm:py-5 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <PhoneIcon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">{t('contact.label')}</p>
          <a
            href={SITE_CONTACT.telHref}
            className="mt-1 block text-xl font-bold text-white transition hover:text-brand-200 sm:text-2xl"
          >
            {SITE_CONTACT.phoneDisplay}
          </a>
          <p className="mt-1 text-sm text-slate-400">{t('contact.bannerHint')}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={SITE_CONTACT.telHref} className="btn-luxury-light py-2 pl-5 pr-1.5 text-xs normal-case tracking-normal">
          <span>{t('contact.call')}</span>
          <span className="btn-luxury-icon h-8 w-8 bg-slate-950 text-white">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </a>
        <a
          href={siteWhatsAppHref()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-white/30 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
        >
          {t('contact.whatsapp')}
        </a>
      </div>
    </div>
  )
}
