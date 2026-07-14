import type { PublicListingSummary } from '../api/types'

/** Apartments browse - residential only; shop inventory uses /shops. */
export function filterApartmentBrowseListings(items: PublicListingSummary[]): PublicListingSummary[] {
  return items.filter(
    (item) =>
      !item.project_slug.startsWith('shop-') &&
      item.unit_type_code !== 'TSHOP' &&
      item.use_segment !== 'retail',
  )
}
