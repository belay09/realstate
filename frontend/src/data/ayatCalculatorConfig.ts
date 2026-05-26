/**
 * Ayat pricing calculator — constants from official strategy (Ayat/116/2018).
 * Data: frontend/src/data/ayat_official_2018.json (sync with backend/data/).
 */
import {
  buildCommercialZones,
  buildMilestoneSchedules,
  buildResidentialPriceRows,
  OFFICIAL_BEDROOM_AREA_OPTIONS,
  OFFICIAL_RESIDENTIAL_PROJECTS,
  OFFICIAL_SHOP_SIZE_MAX,
  OFFICIAL_SHOP_SIZE_MIN,
} from './buildCalculatorFromOfficial'

export type PropertyKind = 'residential' | 'commercial'

export type FinishKind = 'semi-finished' | 'regular-finished'

export type CompletionKind = 'unstarted' | 'near_completion'

export interface DownPaymentTier {
  id: string
  downPaymentPercent: number
  clientDiscountPercent: number
  labelKey: string
  /** 60/40 plan: discount applies; down payment at signing is milestone-based, not this percent alone */
  is6040?: boolean
}

export interface FloorBand {
  label: string
  floorMin: number
  floorMax: number
}

export interface ResidentialPriceRow {
  projectId: string
  unitTypeCode: string
  finishType: FinishKind
  floorBand: FloorBand
  pricePerSqm: number
}

export interface ResidentialProject {
  id: string
  areaLabelKey: string
  nameKey: string
  maxFloor: number
  supportsCompletionChoice: boolean
  /** Section 10 strategy table uses floors 3–36; inventory projects use 1–maxFloor */
  usesStrategyFloorTable?: boolean
}

/** Apartment pricing areas from Ayat strategy Section 10 (per square meter tables) */
export const STRATEGY_RESIDENTIAL_PROJECT_IDS = [
  'lideta-unstarted',
  'kazanchis-started',
  'bole-unstarted',
] as const

export interface CommercialZone {
  id: string
  labelKey: string
  floors: Record<'GF' | '1F' | '2F' | '3F', number>
}

export interface MilestoneStep {
  id: string
  labelKey: string
  percent: number
}

export const CURRENCY = 'ETB'

export const RESIDENTIAL_PROJECTS: ResidentialProject[] = OFFICIAL_RESIDENTIAL_PROJECTS

export function floorOptionsForProject(project: ResidentialProject): number[] {
  const min = project.usesStrategyFloorTable ? 3 : 1
  return Array.from({ length: project.maxFloor - min + 1 }, (_, i) => i + min)
}

/** Bedroom count → allowed sizes (m²) per Ayat strategy Section 1 */
/** Section 2 sizes; 107 m² kept for existing CMC inventory units */
export const BEDROOM_AREA_OPTIONS: Record<1 | 2 | 3, number[]> = OFFICIAL_BEDROOM_AREA_OPTIONS

export const COMMERCIAL_AREA_PRESETS = [30, 50, 75, 100, 150, 200, 240]

/** Client discount by upfront / plan tier (Section 6) */
export const DOWN_PAYMENT_TIERS: DownPaymentTier[] = [
  { id: '100', downPaymentPercent: 100, clientDiscountPercent: 20, labelKey: 'calculator.tiers.t100' },
  { id: '85', downPaymentPercent: 85, clientDiscountPercent: 17, labelKey: 'calculator.tiers.t85' },
  { id: '70', downPaymentPercent: 70, clientDiscountPercent: 14, labelKey: 'calculator.tiers.t70' },
  { id: '55', downPaymentPercent: 55, clientDiscountPercent: 11, labelKey: 'calculator.tiers.t55' },
  { id: '40', downPaymentPercent: 40, clientDiscountPercent: 8, labelKey: 'calculator.tiers.t40' },
  { id: '35', downPaymentPercent: 35, clientDiscountPercent: 7, labelKey: 'calculator.tiers.t35' },
  {
    id: '60_40',
    downPaymentPercent: 60,
    clientDiscountPercent: 5,
    labelKey: 'calculator.tiers.t6040',
    is6040: true,
  },
]

export const RESIDENTIAL_PRICE_ROWS: ResidentialPriceRow[] = buildResidentialPriceRows()

export const COMMERCIAL_ZONES: CommercialZone[] = buildCommercialZones()

export const COMMERCIAL_AREA_MIN = OFFICIAL_SHOP_SIZE_MIN
export const COMMERCIAL_AREA_MAX = OFFICIAL_SHOP_SIZE_MAX

export type MilestoneScheduleId =
  | 'apt_near_100'
  | 'apt_unstarted_100'
  | 'apt_6040'
  | 'shop_unstarted_100'

export const MILESTONE_SCHEDULES: Record<MilestoneScheduleId, MilestoneStep[]> =
  buildMilestoneSchedules()

export function unitTypeForBedroomsFinish(
  bedrooms: 1 | 2 | 3,
  finish: FinishKind,
): string {
  if (finish === 'semi-finished') {
    if (bedrooms === 3) return 'SFCR'
    return 'SFCA'
  }
  if (bedrooms === 3) return 'RFCR'
  return 'RFCA'
}
