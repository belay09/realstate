import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { PublicFooter } from '../components/PublicFooter'
import { SiteContactStrip } from '../components/SiteContactStrip'
import { ThemeToggle } from '../components/ThemeToggle'
import { SITE_CONTACT } from '../content/siteContact'
import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import { useAdminEntryPath } from '../hooks/useAuth'

function navActive(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`)
}

export function PublicLayout() {
  const { t, messages } = useTranslation()
  const adminPath = useAdminEntryPath()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isFullBleed = isHome
  const brand = messages.brand
  const path = location.pathname

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl ${
          isFullBleed
            ? 'border-b border-transparent bg-surface/70'
            : 'border-b border-border bg-surface/90'
        }`}
      >
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-8">
          <Link to="/" className="group flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold text-white shadow-lg shadow-brand-900/25 transition group-hover:scale-105"
              aria-hidden
            >
              B
            </span>
            <div className="min-w-0 leading-tight">
              <span className="block truncate text-lg font-bold text-fg sm:text-xl">{brand.name}</span>
              <span className="block truncate text-[0.7rem] font-medium text-brand-700 dark:text-brand-300 sm:hidden">
                {brand.tagline}
              </span>
              <span className="hidden truncate text-xs font-medium text-brand-700 dark:text-brand-300 sm:block">
                {brand.tagline}
                <span className="mx-1.5 text-fg-muted/50">·</span>
                <span className="font-normal text-fg-muted">{brand.headerNote}</span>
              </span>
            </div>
          </Link>

          <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
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
            <NavLink
              to="/apartments"
              className={() =>
                `hidden rounded-full px-4 py-2 md:inline-block ${
                  navActive(path, '/apartments')
                    ? 'bg-brand-50 font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200'
                    : 'nav-link'
                }`
              }
            >
              {t('nav.apartments')}
            </NavLink>
            <NavLink
              to="/shops"
              className={() =>
                `hidden rounded-full px-4 py-2 sm:inline-block ${
                  navActive(path, '/shops')
                    ? 'bg-brand-50 font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200'
                    : 'nav-link'
                }`
              }
            >
              {t('nav.shops')}
            </NavLink>
            <NavLink
              to="/calculator"
              className={({ isActive }) =>
                `hidden rounded-full px-4 py-2 md:inline-block ${
                  isActive
                    ? 'bg-brand-50 font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200'
                    : 'nav-link'
                }`
              }
            >
              {t('nav.calculator')}
            </NavLink>
            <Link
              to={`/apartments?company_slug=${AYAT_PARTNER.slug}`}
              className="nav-link hidden px-3 py-2 lg:inline"
            >
              {t('nav.ayatBrowse')}
            </Link>
            <Link
              to={`/apartments?company_slug=${TEMER_PARTNER.slug}`}
              className="nav-link hidden px-3 py-2 lg:inline"
            >
              {t('nav.temer')}
            </Link>
            <Link to={adminPath} className="nav-link hidden px-3 py-2 md:inline">
              {t('nav.staff')}
            </Link>
            <a
              href={SITE_CONTACT.telHref}
              className="hidden rounded-full bg-slate-950 px-3 py-2 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 sm:inline-flex"
            >
              {SITE_CONTACT.phoneDisplay}
            </a>
            <LanguageSwitcher className="inline-flex" />
            <ThemeToggle />
            <Link to="/apartments" className="btn-luxury ml-1 hidden py-2 pl-5 pr-1.5 text-xs normal-case tracking-normal md:inline-flex">
              <span>{t('nav.browseHomes')}</span>
              <span className="btn-luxury-icon h-8 w-8">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </nav>
        </div>
        <div className="border-t border-border bg-surface-muted/40 px-4 pb-3 pt-2 md:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm ${
                  isActive
                    ? 'bg-brand-600 font-semibold text-white shadow-sm'
                    : 'nav-link'
                }`
              }
            >
              {t('nav.home')}
            </NavLink>
            <NavLink
              to="/apartments"
              className={() =>
                `rounded-full px-3 py-1.5 text-sm ${
                  navActive(path, '/apartments')
                    ? 'bg-brand-600 font-semibold text-white shadow-sm'
                    : 'nav-link'
                }`
              }
            >
              {t('nav.apartments')}
            </NavLink>
            <NavLink
              to="/shops"
              className={() =>
                `rounded-full px-3 py-1.5 text-sm ${
                  navActive(path, '/shops')
                    ? 'bg-brand-600 font-semibold text-white shadow-sm'
                    : 'nav-link'
                }`
              }
            >
              {t('nav.shops')}
            </NavLink>
            <NavLink
              to="/calculator"
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm ${
                  isActive
                    ? 'bg-brand-600 font-semibold text-white shadow-sm'
                    : 'nav-link'
                }`
              }
            >
              {t('nav.calculator')}
            </NavLink>
            <Link
              to={`/apartments?company_slug=${AYAT_PARTNER.slug}`}
              className="nav-link rounded-full px-3 py-1.5 text-sm"
            >
              {t('nav.ayatBrowse')}
            </Link>
            <Link
              to={`/apartments?company_slug=${TEMER_PARTNER.slug}`}
              className="nav-link rounded-full px-3 py-1.5 text-sm"
            >
              {t('nav.temer')}
            </Link>
            <a
              href={SITE_CONTACT.telHref}
              className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white sm:text-sm"
            >
              {SITE_CONTACT.phoneDisplay}
            </a>
            <Link to={adminPath} className="nav-link rounded-full px-3 py-1.5 text-sm">
              {t('nav.staff')}
            </Link>
          </div>
        </div>
      </header>

      <main
        className={`mx-auto w-full flex-1 pb-24 ${isFullBleed ? '' : 'max-w-[90rem] px-4 py-10 sm:px-8'}`}
      >
        <Outlet />
      </main>

      <SiteContactStrip />

      <PublicFooter brandName={brand.name} adminPath={adminPath} />
    </div>
  )
}
