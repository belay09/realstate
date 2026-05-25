export function formatMoney(amount: string | number, currency: string) {
  const n = typeof amount === 'string' ? Number(amount) : amount
  if (Number.isNaN(n)) return `${amount} ${currency}`
  try {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: currency === 'ETB' ? 'ETB' : currency,
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `${n.toLocaleString()} ${currency}`
  }
}
