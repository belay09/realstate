import { Link } from 'react-router-dom'

import { useAdminEntryPath } from '../hooks/useAuth'

export function HomePage() {
  const adminPath = useAdminEntryPath()
  return (
    <div className="space-y-8 text-left">
      <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-950">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Belay Properties
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 md:text-4xl">
          Verified homes from trusted developers.
        </h1>
        <p className="mt-4 max-w-2xl text-stone-600 dark:text-stone-300">
          Browse public listings from partner companies. Pricing and payment previews will appear here as we
          connect the next backend phases.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/listings"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-800"
          >
            Browse listings
          </Link>
          <Link
            to={adminPath}
            className="inline-flex items-center justify-center rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            Staff login
          </Link>
        </div>
      </section>
    </div>
  )
}
