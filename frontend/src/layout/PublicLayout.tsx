import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { ThemeToggle } from '../components/ThemeToggle'
import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER } from '../content/partners'
import { useAdminEntryPath } from '../hooks/useAuth'

function navActive(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`)
}

export function PublicLayout() {
  const { t, messages } = useTranslation()
  const adminPath = useAdminEntryPath()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const brand = messages.brand
  const path = location.pathname

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-50 border-b border-border bg-surface/85 backdrop-blur-xl">
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
                `rounded-full px-4 py-2 ${
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
            <a
              href={AYAT_PARTNER.website}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link hidden px-3 py-2 lg:inline"
            >
              {t('nav.ayat')}
            </a>
            <Link to={adminPath} className="nav-link hidden px-3 py-2 md:inline">
              {t('nav.staff')}
            </Link>
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <ThemeToggle />
            <Link to="/apartments" className="btn-primary ml-1 hidden py-2.5 text-xs md:inline-flex">
              {t('nav.browseHomes')}
            </Link>
          </nav>
        </div>
        <div className="border-t border-border px-4 pb-3 pt-0 sm:hidden">
          <LanguageSwitcher className="w-full justify-center" />
        </div>
      </header>

      <main className={`mx-auto w-full flex-1 ${isHome ? '' : 'max-w-[90rem] px-4 py-10 sm:px-8'}`}>
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-border bg-slate-900 text-slate-300 dark:bg-slate-950">
        <div className="mx-auto grid max-w-[90rem] gap-10 px-4 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-2xl font-bold text-white">{brand.name}</p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
              {t('footer.description', { ayatBrand: AYAT_PARTNER.brandName })}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-300/90">
              {t('footer.explore')}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/apartments" className="transition hover:text-white">
                  {t('footer.apartments')}
                </Link>
              </li>
              <li>
                <Link to="/shops" className="transition hover:text-white">
                  {t('footer.shops')}
                </Link>
              </li>
              <li>
                <Link to="/calculator" className="transition hover:text-white">
                  {t('footer.calculator')}
                </Link>
              </li>
              <li>
                <a
                  href={AYAT_PARTNER.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                >
                  {t('footer.officialAyat')}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {brand.name} · {t('footer.copyright')}
        </p>
      </footer>
    </div>
  )
}
