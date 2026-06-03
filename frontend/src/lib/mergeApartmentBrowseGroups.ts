import type { PublicLocationBrowseSummary, PublicLocationVisibility } from '../api/types'
import { AYAT_PARTNER } from '../content/partners'
import type { ProjectListingGroup } from './groupListingsByProject'
import { isLocationActive } from './locationVisibility'

/** Merge CMS apartment locations with listing groups so new zones appear before any homes are listed. */
export function mergeApartmentBrowseGroups(
  groups: ProjectListingGroup[],
  summaries: Map<string, PublicLocationBrowseSummary> | undefined,
  visibility: PublicLocationVisibility | undefined,
  companySlugFilter: string,
): ProjectListingGroup[] {
  const bySlug = new Map(groups.map((g) => [g.project_slug, g]))
  const merged: ProjectListingGroup[] = []
  const seen = new Set<string>()

  if (summaries && (!companySlugFilter || companySlugFilter === AYAT_PARTNER.slug)) {
    for (const [locationId, cms] of summaries) {
      if (!isLocationActive(visibility, 'apartment', locationId)) continue
      seen.add(locationId)
      const existing = bySlug.get(locationId)
      if (existing) {
        merged.push({
          ...existing,
          primary_image_url: cms.cover_image_url || existing.primary_image_url,
        })
      } else {
        merged.push({
          project_slug: locationId,
          project_name: cms.title.trim() || locationId,
          area: cms.subtitle?.trim() || null,
          city: 'Addis Ababa',
          company_name: AYAT_PARTNER.legalName,
          company_slug: AYAT_PARTNER.slug,
          primary_image_url: cms.cover_image_url ?? null,
          listings: [],
          bedroomCounts: [],
        })
      }
    }
  }

  for (const group of groups) {
    if (seen.has(group.project_slug)) continue
    if (companySlugFilter && group.company_slug !== companySlugFilter) continue
    if (
      group.company_slug === AYAT_PARTNER.slug &&
      !isLocationActive(visibility, 'apartment', group.project_slug)
    ) {
      continue
    }
    merged.push(group)
    seen.add(group.project_slug)
  }

  return merged.sort((a, b) => {
    const labelA = a.area ?? a.project_name
    const labelB = b.area ?? b.project_name
    return labelA.localeCompare(labelB)
  })
}
