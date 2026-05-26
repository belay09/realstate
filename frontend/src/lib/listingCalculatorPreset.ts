import type { PublicListingDetail } from '../api/types'
import type { CompletionKind, FinishKind } from '../data/ayatCalculatorConfig'

export type ListingCalculatorPreset = {
  propertyKind: 'residential'
  projectId: string
  bedrooms: 1 | 2 | 3
  finish: FinishKind
  areaSqm: number
  floor: number
  completion: CompletionKind
}

const SEMI_FINISHED_CODES = new Set(['SFCA', 'SFCR'])
const SUPPORTED_PROJECTS = new Set([
  'ayat-hills',
  'cmc-extension',
  'lideta-residential',
  'kazanchis-residential',
  'bole-belair',
])

export function finishFromUnitTypeCode(code: string): FinishKind {
  return SEMI_FINISHED_CODES.has(code) ? 'semi-finished' : 'regular-finished'
}

export function bedroomsFromUnitTypeCode(code: string): 1 | 2 | 3 | null {
  if (code === 'SFCR' || code === 'RFCR') return 3
  if (code === 'SFCA' || code === 'RFCA') return 2
  return null
}

export function presetFromListing(listing: PublicListingDetail): ListingCalculatorPreset | null {
  if (listing.company_slug !== 'ayat-real-estate') return null
  if (!listing.project_slug || !SUPPORTED_PROJECTS.has(listing.project_slug)) return null
  if (listing.floor_number == null) return null

  const area = listing.area_sqm ? Number(listing.area_sqm) : NaN
  if (!Number.isFinite(area) || area <= 0) return null

  let bedrooms: 1 | 2 | 3 | null = null
  if (listing.bedrooms === 1 || listing.bedrooms === 2 || listing.bedrooms === 3) {
    bedrooms = listing.bedrooms
  } else {
    bedrooms = bedroomsFromUnitTypeCode(listing.unit_type_code)
  }
  if (!bedrooms) return null

  return {
    propertyKind: 'residential',
    projectId: listing.project_slug,
    bedrooms,
    finish: finishFromUnitTypeCode(listing.unit_type_code),
    areaSqm: area,
    floor: listing.floor_number,
    completion: 'unstarted',
  }
}
