import { Link } from 'react-router-dom'

const CHECKLIST = [
  {
    step: '1',
    title: 'Companies',
    href: '/admin/companies',
    desc: 'Name, logo, description - Active partners appear on the home page.',
  },
  {
    step: '2',
    title: 'Locations',
    href: '/admin/listings',
    desc: 'Residential or Shops pages: media, description, Active / Visible.',
  },
  {
    step: '3',
    title: 'Floor m² rates',
    href: '/admin/pricing',
    desc: 'ETB per m² rows shown on each location terminal page.',
  },
  {
    step: '4',
    title: 'Leads',
    href: '/admin/leads',
    desc: 'Optional - follow up Call / WhatsApp enquiries from the site.',
  },
] as const

export function AdminDashboardPage() {
  return (
    <div className="space-y-6 text-left">
      <h1 className="text-2xl font-semibold text-fg">Dashboard</h1>
      <p className="text-sm text-fg-muted">
        How to publish - same path buyers take: home developers → location pages → floor rates.
      </p>
      <ol className="space-y-3">
        {CHECKLIST.map(({ step, title, href, desc }) => (
          <li key={href}>
            <Link
              to={href}
              className="flex gap-4 rounded-lg border border-border bg-surface p-4 transition hover:border-brand-400 dark:hover:border-brand-600"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200">
                {step}
              </span>
              <span>
                <span className="text-base font-semibold text-fg">{title}</span>
                <p className="mt-1 text-sm text-fg-muted">{desc}</p>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="text-xs text-fg-muted">
        Preview:{' '}
        <Link to="/" className="font-medium text-brand-700 underline dark:text-brand-300">
          Home
        </Link>
      </p>
    </div>
  )
}
