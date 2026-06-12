import type { PublicLocationVisibility } from '../api/types'

export function isLocationActive(
  visibility: PublicLocationVisibility | undefined,
  kind: 'apartment' | 'shop',
  locationId: string,
): boolean {
  const map = visibility?.[kind === 'apartment' ? 'apartment' : 'shop']
  if (!map) {
    return kind === 'apartment'
  }
  if (!(locationId in map)) {
    return false
  }
  return map[locationId]
}

export function filterApartmentProjectSlugs(
  projectSlugs: string[],
  visibility: PublicLocationVisibility | undefined,
): string[] {
  return projectSlugs.filter((slug) => isLocationActive(visibility, 'apartment', slug))
}
