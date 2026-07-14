import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { ThemeToggle } from '../components/ThemeToggle'
import { SITE_CONTACT } from '../content/siteContact'
import { clearAccessToken } from '../lib/auth'
import { SHOW_ADMIN_ADVANCED } from '../lib/featureFlags'

const navCls =
  'rounded-md px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-muted'

const activeCls = 'bg-brand-50 font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200'

export function AdminLayout() {
  const navigate = useNavigate()

  function logout() {
    clearAccessToken()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas md:flex-row">
      <aside className="flex flex-col border-b border-border bg-surface md:w-56 md:min-h-dvh md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-2 px-4 py-4 md:block">
          <Link
            to="/admin/companies"
            className="text-sm font-semibold tracking-tight text-brand-700 dark:text-brand-300"
          >
            Habesha Admin
          </Link>
          <div className="flex items-center gap-2 md:mt-3 md:block">
            <ThemeToggle className="md:mb-2" />
            <button
              type="button"
              onClick={logout}
              className="text-xs font-medium text-fg-muted underline-offset-2 hover:underline"
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="flex flex-wrap gap-1 px-2 pb-4 md:flex-col md:gap-0.5">
          <NavLink
            to="/admin/companies"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Companies
          </NavLink>
          <NavLink
            to="/admin/listings"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Locations
          </NavLink>
          <NavLink
            to="/admin/pricing"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Floor m² rates
          </NavLink>
          <NavLink
            to="/admin/leads"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Leads
          </NavLink>

          {/* Phase4+ slim: Properties / Promotions - restore via SHOW_ADMIN_ADVANCED */}
          {SHOW_ADMIN_ADVANCED ? (
            <>
              <NavLink
                to="/admin/properties"
                className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
              >
                Properties
              </NavLink>
              <NavLink
                to="/admin/promotions"
                className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
              >
                Promotions
              </NavLink>
            </>
          ) : null}

          <NavLink to="/" className={`${navCls} mt-2 md:mt-3`}>
            View public site
          </NavLink>
        </nav>
        <p className="mt-auto hidden px-4 pb-4 text-xs text-fg-muted md:block">
          <a href={SITE_CONTACT.telHref} className="font-semibold text-brand-700 dark:text-brand-300">
            {SITE_CONTACT.phoneDisplay}
          </a>
        </p>
      </aside>
      <div className="flex-1 bg-canvas">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
