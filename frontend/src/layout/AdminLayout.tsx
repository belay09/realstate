import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { ThemeToggle } from '../components/ThemeToggle'
import { clearAccessToken } from '../lib/auth'

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
      <aside className="border-b border-border bg-surface md:w-56 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-2 px-4 py-4 md:block">
          <Link to="/admin" className="text-sm font-semibold text-brand-700 dark:text-brand-300">
            Admin
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
        <nav className="flex flex-wrap gap-1 px-2 pb-4 md:flex-col">
          <NavLink to="/admin" end className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}>
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/companies"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Companies
          </NavLink>
          <NavLink
            to="/admin/projects"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Projects
          </NavLink>
          <NavLink
            to="/admin/blocks"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Blocks
          </NavLink>
          <NavLink
            to="/admin/unit-types"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Unit types
          </NavLink>
          <NavLink
            to="/admin/units"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Units
          </NavLink>
          <NavLink
            to="/admin/listings"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Listings
          </NavLink>
          <NavLink
            to="/admin/pricing"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Pricing
          </NavLink>
          <NavLink
            to="/admin/payment-plans"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Payment plans
          </NavLink>
          <NavLink
            to="/admin/quotes"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Quotes
          </NavLink>
          <NavLink
            to="/admin/leads"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Leads
          </NavLink>
          <NavLink
            to="/admin/contracts"
            className={({ isActive }) => `${navCls} ${isActive ? activeCls : ''}`}
          >
            Contracts
          </NavLink>
          <NavLink to="/listings" className={navCls}>
            View public site
          </NavLink>
        </nav>
      </aside>
      <div className="flex-1 bg-canvas">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
