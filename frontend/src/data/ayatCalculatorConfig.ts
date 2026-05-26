/**
 * Ayat indicative pricing for the public calculator.
 * Logic follows Ayat Share Company sales strategy (ref Ayat/SLe/116/2018).
 * Per-sqm figures for CMC and Ayat Hills align with backend/data/ayat_production.json.
 * Shop per-sqm values are from the strategy document Section 11.
 * Always verify with Ayat before signing a contract.
 */

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
}

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

export const RESIDENTIAL_PROJECTS: ResidentialProject[] = [
  {
    id: 'cmc-extension',
    areaLabelKey: 'calculator.zones.cmc',
    nameKey: 'calculator.projects.cmc',
    maxFloor: 17,
    supportsCompletionChoice: true,
  },
  {
    id: 'ayat-hills',
    areaLabelKey: 'calculator.zones.ayat',
    nameKey: 'calculator.projects.ayatHills',
    maxFloor: 16,
    supportsCompletionChoice: false,
  },
]

/** Bedroom count → allowed sizes (m²) per Ayat strategy Section 1 */
export const BEDROOM_AREA_OPTIONS: Record<1 | 2 | 3, number[]> = {
  1: [40, 45, 55, 60],
  2: [75, 80, 107],
  3: [90, 95, 105, 110, 115],
}

export const COMMERCIAL_AREA_MIN = 30
export const COMMERCIAL_AREA_MAX = 240
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

/** Per-sqm (ETB, VAT-inclusive estimates) from ayat_production.json */
export const RESIDENTIAL_PRICE_ROWS: ResidentialPriceRow[] = [
  { projectId: 'ayat-hills', unitTypeCode: 'SFCA', finishType: 'semi-finished', floorBand: { label: '1-4', floorMin: 1, floorMax: 4 }, pricePerSqm: 188000 },
  { projectId: 'ayat-hills', unitTypeCode: 'SFCA', finishType: 'semi-finished', floorBand: { label: '5-8', floorMin: 5, floorMax: 8 }, pricePerSqm: 181000 },
  { projectId: 'ayat-hills', unitTypeCode: 'SFCA', finishType: 'semi-finished', floorBand: { label: '9-12', floorMin: 9, floorMax: 12 }, pricePerSqm: 175000 },
  { projectId: 'ayat-hills', unitTypeCode: 'SFCA', finishType: 'semi-finished', floorBand: { label: '13-16', floorMin: 13, floorMax: 16 }, pricePerSqm: 169000 },
  { projectId: 'ayat-hills', unitTypeCode: 'SFCR', finishType: 'semi-finished', floorBand: { label: '1-4', floorMin: 1, floorMax: 4 }, pricePerSqm: 192000 },
  { projectId: 'ayat-hills', unitTypeCode: 'SFCR', finishType: 'semi-finished', floorBand: { label: '5-8', floorMin: 5, floorMax: 8 }, pricePerSqm: 185000 },
  { projectId: 'ayat-hills', unitTypeCode: 'SFCR', finishType: 'semi-finished', floorBand: { label: '9-12', floorMin: 9, floorMax: 12 }, pricePerSqm: 178000 },
  { projectId: 'ayat-hills', unitTypeCode: 'RFCR', finishType: 'regular-finished', floorBand: { label: '9-16', floorMin: 9, floorMax: 16 }, pricePerSqm: 198000 },
  { projectId: 'ayat-hills', unitTypeCode: 'RFCA', finishType: 'regular-finished', floorBand: { label: '9-16', floorMin: 9, floorMax: 16 }, pricePerSqm: 198000 },
  { projectId: 'cmc-extension', unitTypeCode: 'SFCA', finishType: 'semi-finished', floorBand: { label: '1-4', floorMin: 1, floorMax: 4 }, pricePerSqm: 185000 },
  { projectId: 'cmc-extension', unitTypeCode: 'SFCA', finishType: 'semi-finished', floorBand: { label: '5-8', floorMin: 5, floorMax: 8 }, pricePerSqm: 178000 },
  { projectId: 'cmc-extension', unitTypeCode: 'SFCA', finishType: 'semi-finished', floorBand: { label: '9-12', floorMin: 9, floorMax: 12 }, pricePerSqm: 172000 },
  { projectId: 'cmc-extension', unitTypeCode: 'SFCA', finishType: 'semi-finished', floorBand: { label: '13-17', floorMin: 13, floorMax: 17 }, pricePerSqm: 165000 },
  { projectId: 'cmc-extension', unitTypeCode: 'SFCR', finishType: 'semi-finished', floorBand: { label: '1-8', floorMin: 1, floorMax: 8 }, pricePerSqm: 180000 },
  { projectId: 'cmc-extension', unitTypeCode: 'SFCR', finishType: 'semi-finished', floorBand: { label: '9-17', floorMin: 9, floorMax: 17 }, pricePerSqm: 173000 },
  { projectId: 'cmc-extension', unitTypeCode: 'RFCA', finishType: 'regular-finished', floorBand: { label: '10-17', floorMin: 10, floorMax: 17 }, pricePerSqm: 190000 },
  { projectId: 'cmc-extension', unitTypeCode: 'RFCR', finishType: 'regular-finished', floorBand: { label: '10-17', floorMin: 10, floorMax: 17 }, pricePerSqm: 190000 },
]

/** CMC near-completion uplift vs unstarted (Section 10, floors 3–10 SFCA sample ratio) */
export const CMC_NEAR_COMPLETION_PRICE_FACTOR = 185449 / 146489

/** Shop per-sqm from strategy Section 11 (ETB) */
export const COMMERCIAL_ZONES: CommercialZone[] = [
  {
    id: 'ayat',
    labelKey: 'calculator.shopZones.ayat',
    floors: { GF: 195569, '1F': 188485, '2F': 181654, '3F': 174570 },
  },
  {
    id: 'kazanchis',
    labelKey: 'calculator.shopZones.kazanchis',
    floors: { GF: 227953, '1F': 218592, '2F': 208978, '3F': 199617 },
  },
  {
    id: 'bole-bulbula',
    labelKey: 'calculator.shopZones.boleBulbula',
    floors: { GF: 126564, '1F': 130245, '2F': 124324, '3F': 121364 },
  },
]

export type MilestoneScheduleId =
  | 'apt_near_100'
  | 'apt_unstarted_100'
  | 'apt_6040'
  | 'shop_unstarted_100'

export const MILESTONE_SCHEDULES: Record<MilestoneScheduleId, MilestoneStep[]> = {
  apt_near_100: [
    { id: 'sign', labelKey: 'calculator.milestones.signing', percent: 20 },
    { id: 'm4', labelKey: 'calculator.milestones.month4', percent: 25 },
    { id: 'm8', labelKey: 'calculator.milestones.month8', percent: 25 },
    { id: 'm12', labelKey: 'calculator.milestones.month12', percent: 20 },
    { id: 'handover', labelKey: 'calculator.milestones.handover', percent: 10 },
  ],
  apt_unstarted_100: [
    { id: 'sign', labelKey: 'calculator.milestones.signing', percent: 15 },
    { id: 'm4', labelKey: 'calculator.milestones.month4', percent: 20 },
    { id: 'm8', labelKey: 'calculator.milestones.month8', percent: 20 },
    { id: 'm12', labelKey: 'calculator.milestones.month12', percent: 20 },
    { id: 'm18', labelKey: 'calculator.milestones.month18', percent: 15 },
    { id: 'm24', labelKey: 'calculator.milestones.month24', percent: 5 },
    { id: 'handover', labelKey: 'calculator.milestones.handover', percent: 5 },
  ],
  apt_6040: [
    { id: 'sign', labelKey: 'calculator.milestones.signing', percent: 15 },
    { id: 'm4', labelKey: 'calculator.milestones.month4', percent: 20 },
    { id: 'm8', labelKey: 'calculator.milestones.month8', percent: 10 },
    { id: 'm12', labelKey: 'calculator.milestones.month12', percent: 5 },
    { id: 'm18', labelKey: 'calculator.milestones.month18', percent: 5 },
    { id: 'm24', labelKey: 'calculator.milestones.month24', percent: 3 },
    { id: 'handover', labelKey: 'calculator.milestones.handover', percent: 2 },
  ],
  shop_unstarted_100: [
    { id: 'sign', labelKey: 'calculator.milestones.signing', percent: 25 },
    { id: 'm4', labelKey: 'calculator.milestones.month4', percent: 30 },
    { id: 'm8', labelKey: 'calculator.milestones.month8', percent: 20 },
    { id: 'structure', labelKey: 'calculator.milestones.structure', percent: 15 },
    { id: 'handover', labelKey: 'calculator.milestones.handover', percent: 10 },
  ],
}

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
