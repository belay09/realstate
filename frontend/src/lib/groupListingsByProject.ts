import type { PublicListingSummary } from '../api/types'

export type ProjectListingGroup = {
  project_slug: string
  project_name: string
  area: string | null
  city: string | null
  company_name: string
  company_slug: string
  primary_image_url: string | null
  listings: PublicListingSummary[]
  bedroomCounts: number[]
}

export function groupListingsByProject(items: PublicListingSummary[]): ProjectListingGroup[] {
  const map = new Map<string, ProjectListingGroup>()

  for (const item of items) {
    let group = map.get(item.project_slug)
    if (!group) {
      group = {
        project_slug: item.project_slug,
        project_name: item.project_name,
        area: item.area,
        city: item.city,
        company_name: item.company_name,
        company_slug: item.company_slug,
        primary_image_url: item.primary_image_url,
        listings: [],
        bedroomCounts: [],
      }
      map.set(item.project_slug, group)
    }
    group.listings.push(item)
    if (!group.primary_image_url && item.primary_image_url) {
      group.primary_image_url = item.primary_image_url
    }
  }

  for (const group of map.values()) {
    const beds = new Set(
      group.listings.map((l) => l.bedrooms).filter((b): b is number => b != null),
    )
    group.bedroomCounts = [...beds].sort((a, b) => a - b)
  }

  return [...map.values()].sort((a, b) => {
    const zoneA = a.area ?? a.project_name
    const zoneB = b.area ?? b.project_name
    return zoneA.localeCompare(zoneB)
  })
}
