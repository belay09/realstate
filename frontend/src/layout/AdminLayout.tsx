import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { clearAccessToken } from '../lib/auth'

const navCls =
  'rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'

const activeCls =
  'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'

export function AdminLayout() {
  const navigate = useNavigate()

  function logout() {
    clearAccessToken()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="border-b border-stone-200 bg-white md:w-56 md:border-b-0 md:border-r dark:border-stone-800 dark:bg-stone-950">
        <div className="flex items-center justify-between gap-2 px-4 py-4 md:block">
          <Link
            to="/admin"
            className="text-sm font-semibold text-emerald-800 dark:text-emerald-400"
          >
            Admin
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-medium text-stone-500 underline-offset-2 hover:underline md:mt-3 md:block"
          >
            Log out
          </button>
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
      <div className="flex-1 bg-stone-50 dark:bg-stone-900">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
