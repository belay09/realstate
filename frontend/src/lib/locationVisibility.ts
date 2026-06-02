import type { PublicLocationVisibility } from '../api/types'

export function isLocationActive(
  visibility: PublicLocationVisibility | undefined,
  kind: 'apartment' | 'shop',
  locationId: string,
): boolean {
  if (!visibility) return true
  const map = kind === 'apartment' ? visibility.apartment : visibility.shop
  if (!(locationId in map)) return true
  return map[locationId]
}

export function filterApartmentProjectSlugs(
  projectSlugs: string[],
  visibility: PublicLocationVisibility | undefined,
): string[] {
  return projectSlugs.filter((slug) => isLocationActive(visibility, 'apartment', slug))
}
