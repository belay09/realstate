import { Link } from 'react-router-dom'

export function AdminDashboardPage() {
  return (
    <div className="space-y-6 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Dashboard</h1>
      <p className="text-sm text-stone-600 dark:text-stone-300">
        Manage inventory, payment plans, quotes, and leads. Test the public site from any listing slug after seeding
        demo data.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {[
          ['Companies', '/admin/companies', 'Developers and agencies'],
          ['Projects', '/admin/projects', 'Sites and communities'],
          ['Blocks', '/admin/blocks', 'Buildings / phases'],
          ['Unit types', '/admin/unit-types', 'Catalogue rows'],
          ['Units', '/admin/units', 'Individual homes'],
          ['Listings', '/admin/listings', 'Public marketing pages'],
          ['Pricing', '/admin/pricing', 'Versions, rows, publish'],
          ['Payment plans', '/admin/payment-plans', 'Full pay and 60/40 schedules'],
          ['Quotes', '/admin/quotes', 'Pricing + installments + commission'],
          ['Leads', '/admin/leads', 'Enquiries → quote → reserve → contract'],
          ['Contracts', '/admin/contracts', 'Signed sales contracts'],
        ].map(([title, href, desc]) => (
          <li key={href}>
            <Link
              to={href}
              className="block rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-brand-400 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-brand-700"
            >
              <span className="font-medium text-stone-900 dark:text-stone-50">{title}</span>
              <p className="mt-1 text-xs text-stone-500">{desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
