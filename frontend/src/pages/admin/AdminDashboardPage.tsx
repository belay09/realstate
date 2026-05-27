import { Link } from 'react-router-dom'

const ACTIONS = [
  {
    title: 'Listings',
    href: '/admin/listings',
    desc: 'Turn homes on or off for the public site and add photos.',
  },
  {
    title: 'Leads',
    href: '/admin/leads',
    desc: 'Read enquiries from the website and follow up with buyers.',
  },
  {
    title: 'Pricing',
    href: '/admin/pricing',
    desc: 'Publish Ayat price tables used by the calculator and quotes.',
  },
] as const

export function AdminDashboardPage() {
  return (
    <div className="space-y-6 text-left">
      <h1 className="text-2xl font-semibold text-fg">Dashboard</h1>
      <p className="text-sm text-fg-muted">
        Three things to manage: what visitors see (listings), who contacted you (leads), and
        official prices (pricing). The public site shows locations first — apartments and shops
        separately.
      </p>
      <ul className="grid gap-4 sm:grid-cols-1">
        {ACTIONS.map(({ title, href, desc }) => (
          <li key={href}>
            <Link
              to={href}
              className="surface block p-5 transition hover:border-brand-400 dark:hover:border-brand-600"
            >
              <span className="text-lg font-semibold text-fg">{title}</span>
              <p className="mt-2 text-sm text-fg-muted">{desc}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-fg-muted">
        Public preview:{' '}
        <Link to="/apartments" className="font-medium text-brand-700 underline dark:text-brand-300">
          Apartments
        </Link>
        {' · '}
        <Link to="/shops" className="font-medium text-brand-700 underline dark:text-brand-300">
          Shops
        </Link>
      </p>
    </div>
  )
}
