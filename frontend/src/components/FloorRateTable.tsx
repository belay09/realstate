import { formatMoney } from '../lib/format'

export type FloorRateTableRow = {
  key: string
  floorLabel: string
  /** Optional second column (e.g. home type for residential). */
  detailLabel?: string
  pricePerSqm: number
}

type FloorRateTableProps = {
  id?: string
  title: string
  floorColumnLabel: string
  priceColumnLabel: string
  detailColumnLabel?: string
  note?: string
  currency?: string
  rows: FloorRateTableRow[]
  emptyMessage?: string
}

/** Shared shop/residential ETB/m² rate table for location terminal pages. */
export function FloorRateTable({
  id,
  title,
  floorColumnLabel,
  priceColumnLabel,
  detailColumnLabel,
  note,
  currency = 'ETB',
  rows,
  emptyMessage,
}: FloorRateTableProps) {
  if (rows.length === 0) {
    if (!emptyMessage) return null
    return (
      <section id={id} className="scroll-mt-28">
        <p className="text-sm text-fg-muted">{emptyMessage}</p>
      </section>
    )
  }

  const showDetail = Boolean(detailColumnLabel) && rows.some((r) => r.detailLabel)

  return (
    <section id={id} className="floor-rate-table scroll-mt-28 overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold tracking-tight text-fg sm:text-base">{title}</h2>
      </div>

      {/* Mobile: stacked rows — easier to read than a narrow table */}
      <ul className="divide-y divide-border sm:hidden">
        {rows.map((row) => (
          <li key={row.key} className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg">{row.floorLabel}</p>
              {showDetail && row.detailLabel ? (
                <p className="mt-1 text-xs text-fg-muted">{row.detailLabel}</p>
              ) : null}
            </div>
            <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-fg">
              {formatMoney(row.pricePerSqm, currency)}
              <span className="block text-xs font-medium text-fg-muted">/ m²</span>
            </p>
          </li>
        ))}
      </ul>

      {/* Desktop / tablet: classic table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/80">
              <th className="px-5 py-3.5 font-semibold text-fg sm:px-6">{floorColumnLabel}</th>
              {showDetail ? (
                <th className="px-5 py-3.5 font-semibold text-fg sm:px-6">{detailColumnLabel}</th>
              ) : null}
              <th className="px-5 py-3.5 font-semibold text-fg sm:px-6">{priceColumnLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-border last:border-0">
                <td className="px-5 py-3.5 text-fg sm:px-6">{row.floorLabel}</td>
                {showDetail ? (
                  <td className="px-5 py-3.5 text-fg-muted sm:px-6">{row.detailLabel ?? '—'}</td>
                ) : null}
                <td className="px-5 py-3.5 font-medium tabular-nums text-fg sm:px-6">
                  {formatMoney(row.pricePerSqm, currency)}
                  <span className="text-fg-muted"> / m²</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {note ? (
        <p className="border-t border-border px-5 py-3.5 text-xs leading-relaxed text-fg-muted sm:px-6">
          {note}
        </p>
      ) : null}
    </section>
  )
}
