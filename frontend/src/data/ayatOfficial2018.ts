/**
 * Official Ayat strategy JSON (Ayat/116/2018).
 * Canonical file: backend/data/ayat_official_2018.json — keep in sync when editing.
 */
import raw from './ayat_official_2018.json'

export type MilestoneStepJson = { id: string; percent: number }

export type ShopZoneJson = {
  id: string
  label: string
  floors: {
    GF: number | null
    '1F': number | null
    '2F': number | null
    '3F': number | null
  }
}

export type AyatOfficial2018 = {
  section2_bedroom_sizes_sqm: Record<'1' | '2' | '3', number[]>
  section10_apartments: {
    floor_bands: Array<{ label: string; floor_min: number; floor_max: number }>
    locations: Record<
      string,
      Partial<Record<'SFCA' | 'SFCR' | 'RFCA' | 'RFCR', Record<string, number>>>
    >
    listing_project_map: Record<string, unknown>
  }
  section11_shops: {
    size_min_sqm: number
    size_max_sqm: number
    zones: ShopZoneJson[]
  }
  section13_milestones: Record<string, MilestoneStepJson[]>
}

export const official = raw as AyatOfficial2018
