import type { PublicLocationBrowseSummary, PublicLocationVisibility } from '../api/types'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import type { ProjectListingGroup } from './groupListingsByProject'
import { isLocationActive } from './locationVisibility'

const PARTNER_BY_SLUG = {
  [AYAT_PARTNER.slug]: AYAT_PARTNER,
  [TEMER_PARTNER.slug]: TEMER_PARTNER,
} as const

function partnerFromSlug(slug: string | undefined) {
  if (slug && slug in PARTNER_BY_SLUG) {
    return PARTNER_BY_SLUG[slug as keyof typeof PARTNER_BY_SLUG]
  }
  return AYAT_PARTNER
}

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

  const cmsPartner =
    companySlugFilter && companySlugFilter in PARTNER_BY_SLUG
      ? PARTNER_BY_SLUG[companySlugFilter as keyof typeof PARTNER_BY_SLUG]
      : null

  if (summaries && (!companySlugFilter || cmsPartner)) {
    for (const [locationId, cms] of summaries) {
      if (!isLocationActive(visibility, 'apartment', locationId)) continue
      const inferredPartner = cmsPartner ?? partnerFromSlug(cms.company_slug)
      if (companySlugFilter && inferredPartner.slug !== companySlugFilter) continue
      seen.add(locationId)
      const existing = bySlug.get(locationId)
      const partner = existing
        ? PARTNER_BY_SLUG[existing.company_slug as keyof typeof PARTNER_BY_SLUG] ?? inferredPartner
        : inferredPartner
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
          company_name: partner.legalName,
          company_slug: partner.slug,
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
    const partner = PARTNER_BY_SLUG[group.company_slug as keyof typeof PARTNER_BY_SLUG]
    if (partner && !isLocationActive(visibility, 'apartment', group.project_slug)) {
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
