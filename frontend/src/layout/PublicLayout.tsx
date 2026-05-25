import { Link, Outlet } from 'react-router-dom'

import { useAdminEntryPath } from '../hooks/useAuth'

export function PublicLayout() {
  const adminPath = useAdminEntryPath()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight text-emerald-800 dark:text-emerald-400">
            Belay Properties
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-stone-600 dark:text-stone-300">
            <Link to="/listings" className="hover:text-emerald-700 dark:hover:text-emerald-400">
              Listings
            </Link>
            <Link to={adminPath} className="hover:text-emerald-700 dark:hover:text-emerald-400">
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
        Verified Ethiopian real estate — multi-company platform.
      </footer>
    </div>
  )
}
