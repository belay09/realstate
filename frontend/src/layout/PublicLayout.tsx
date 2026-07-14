import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { PublicFooter } from '../components/PublicFooter'
import { SiteContactStrip } from '../components/SiteContactStrip'
import { ThemeToggle } from '../components/ThemeToggle'
import { SITE_CONTACT } from '../content/siteContact'
import { useTranslation } from '../context/LocaleContext'

function PhoneIcon({ className = 'h-4 w-4' }: { className?: string }) {
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

export function PublicLayout() {
  const { t, messages } = useTranslation()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isFullBleed = isHome
  const brand = messages.brand

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl ${
          isFullBleed
            ? 'border-b border-transparent bg-surface/70'
            : 'border-b border-border bg-surface/90'
        }`}
      >
        <div className="mx-auto flex max-w-[90rem] flex-nowrap items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-8 sm:py-4">
          <Link to="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold text-white shadow-lg shadow-brand-900/25 transition group-hover:scale-105 sm:h-10 sm:w-10"
              aria-hidden
            >
              H
            </span>
            <div className="min-w-0 leading-tight">
              <span className="block truncate text-base font-bold text-fg sm:hidden">{brand.shortName}</span>
              <span className="hidden truncate text-lg font-bold text-fg sm:block sm:text-xl">{brand.name}</span>
              <span className="hidden truncate text-xs font-medium text-brand-700 dark:text-brand-300 sm:block">
                {brand.tagline}
                <span className="mx-1.5 text-fg-muted/50">·</span>
                <span className="font-normal text-fg-muted">{brand.headerNote}</span>
              </span>
            </div>
          </Link>

          <nav className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `hidden rounded-full px-4 py-2 sm:inline-block ${
                  isActive
                    ? 'bg-brand-50 font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200'
                    : 'nav-link'
                }`
              }
            >
              {t('nav.home')}
            </NavLink>
            <a
              href={SITE_CONTACT.telHref}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 sm:hidden"
              aria-label={`${t('contact.call')} ${SITE_CONTACT.phoneDisplay}`}
            >
              <PhoneIcon />
            </a>
            <a
              href={SITE_CONTACT.telHref}
              className="hidden rounded-full bg-slate-950 px-3 py-2 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 sm:inline-flex"
            >
              {SITE_CONTACT.phoneDisplay}
            </a>
            <LanguageSwitcher className="inline-flex" />
            <ThemeToggle className="!h-9 !w-9 sm:!h-10 sm:!w-10" />
          </nav>
        </div>
      </header>

      <main
        className={`mx-auto w-full flex-1 ${isHome ? '' : 'pb-24'} ${isFullBleed ? '' : 'max-w-[90rem] px-4 py-8 sm:px-8 sm:py-10'}`}
      >
        <Outlet />
      </main>

      {/* Footer already has a contact hero - hide fixed strip on home to avoid duplicate contact. */}
      {!isHome ? <SiteContactStrip /> : null}

      <PublicFooter brandName={brand.name} reserveContactStrip={!isHome} />
    </div>
  )
}
