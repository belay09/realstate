import { resolveResidentialProjectId } from '../data/buildCalculatorFromOfficial'
import {
  COMMERCIAL_ZONES,
  CURRENCY,
  DOWN_PAYMENT_TIERS,
  MILESTONE_SCHEDULES,
  RESIDENTIAL_PRICE_ROWS,
  RESIDENTIAL_PROJECTS,
  type CommercialZone,
  type CompletionKind,
  type DownPaymentTier,
  type FinishKind,
  type MilestoneScheduleId,
  type PropertyKind,
  unitTypeForBedroomsFinish,
} from '../data/ayatCalculatorConfig'

export interface ResidentialCalcInput {
  projectId: string
  bedrooms: 1 | 2 | 3
  finish: FinishKind
  areaSqm: number
  floor: number
  completion: CompletionKind
  tierId: string
}

export interface CommercialCalcInput {
  zoneId: string
  shopFloor: 'GF' | '1F' | '2F' | '3F'
  areaSqm: number
  tierId: string
}

export interface MilestoneLine {
  id: string
  labelKey: string
  percent: number
  amount: number
}

export interface CalculatorResult {
  currency: string
  propertyKind: PropertyKind
  pricePerSqm: number
  floorBandLabel: string | null
  unitTypeCode: string | null
  listPrice: number
  clientDiscountPercent: number
  clientDiscountAmount: number
  priceAfterDiscount: number
  tier: DownPaymentTier
  /** Cash due now if paying selected upfront % of discounted price (not used for pure milestone 100% flows) */
  upfrontCashDue: number
  remainingAfterUpfront: number
  milestoneScheduleId: MilestoneScheduleId | null
  milestones: MilestoneLine[]
  notes: string[]
}

function roundMoney(n: number): number {
  return Math.round(n)
}

export function findResidentialPriceRow(
  projectId: string,
  unitTypeCode: string,
  finish: FinishKind,
  floor: number,
) {
  const matches = RESIDENTIAL_PRICE_ROWS.filter(
    (r) =>
      r.projectId === projectId &&
      r.unitTypeCode === unitTypeCode &&
      r.finishType === finish &&
      floor >= r.floorBand.floorMin &&
      floor <= r.floorBand.floorMax,
  )
  return matches[0] ?? null
}

export function getTier(tierId: string): DownPaymentTier | undefined {
  return DOWN_PAYMENT_TIERS.find((t) => t.id === tierId)
}

export function getProject(projectId: string) {
  return RESIDENTIAL_PROJECTS.find((p) => p.id === projectId)
}

export function getCommercialZone(zoneId: string): CommercialZone | undefined {
  return COMMERCIAL_ZONES.find((z) => z.id === zoneId)
}

function resolveMilestoneSchedule(
  kind: PropertyKind,
  tier: DownPaymentTier,
  completion: CompletionKind,
): MilestoneScheduleId | null {
  if (kind === 'commercial') {
    return 'shop_unstarted_100'
  }
  if (tier.is6040) return 'apt_6040'
  if (tier.downPaymentPercent === 100) {
    return completion === 'near_completion' ? 'apt_near_100' : 'apt_unstarted_100'
  }
  return null
}

function buildMilestones(
  scheduleId: MilestoneScheduleId,
  priceAfterDiscount: number,
): MilestoneLine[] {
  const steps = MILESTONE_SCHEDULES[scheduleId]
  return steps.map((s) => ({
    id: s.id,
    labelKey: s.labelKey,
    percent: s.percent,
    amount: roundMoney((priceAfterDiscount * s.percent) / 100),
  }))
}

export function calculateResidential(input: ResidentialCalcInput): CalculatorResult | null {
  const project = getProject(input.projectId)
  const tier = getTier(input.tierId)
  if (!project || !tier) return null

  const unitTypeCode = unitTypeForBedroomsFinish(input.bedrooms, input.finish)
  const priceProjectId = resolveResidentialProjectId(input.projectId, input.completion)
  const row = findResidentialPriceRow(
    priceProjectId,
    unitTypeCode,
    input.finish,
    input.floor,
  )

  const notes: string[] = []
  if (!row) {
    notes.push('no_price_row')
    return null
  }

  const pricePerSqm = row.pricePerSqm
  const listPrice = roundMoney(pricePerSqm * input.areaSqm)
  const clientDiscountPercent = tier.clientDiscountPercent
  const clientDiscountAmount = roundMoney((listPrice * clientDiscountPercent) / 100)
  const priceAfterDiscount = listPrice - clientDiscountAmount

  const milestoneScheduleId = resolveMilestoneSchedule('residential', tier, input.completion)
  const milestones = milestoneScheduleId
    ? buildMilestones(milestoneScheduleId, priceAfterDiscount)
    : []

  let upfrontCashDue: number
  let remainingAfterUpfront: number

  if (tier.is6040) {
    upfrontCashDue = roundMoney(priceAfterDiscount * 0.4)
    remainingAfterUpfront = priceAfterDiscount - upfrontCashDue
    notes.push('plan_6040')
  } else if (tier.downPaymentPercent === 100 && milestoneScheduleId) {
    upfrontCashDue = milestones[0]?.amount ?? priceAfterDiscount
    remainingAfterUpfront = priceAfterDiscount - upfrontCashDue
    notes.push('milestone_schedule')
  } else {
    upfrontCashDue = roundMoney((priceAfterDiscount * tier.downPaymentPercent) / 100)
    remainingAfterUpfront = priceAfterDiscount - upfrontCashDue
  }

  if (input.bedrooms === 1) {
    notes.push('one_bed_indicative')
  }

  return {
    currency: CURRENCY,
    propertyKind: 'residential',
    pricePerSqm,
    floorBandLabel: row.floorBand.label,
    unitTypeCode,
    listPrice,
    clientDiscountPercent,
    clientDiscountAmount,
    priceAfterDiscount,
    tier,
    upfrontCashDue,
    remainingAfterUpfront,
    milestoneScheduleId,
    milestones,
    notes,
  }
}

export function calculateCommercial(input: CommercialCalcInput): CalculatorResult | null {
  const zone = getCommercialZone(input.zoneId)
  const tier = getTier(input.tierId)
  if (!zone || !tier) return null

  const pricePerSqm = zone.floors[input.shopFloor]
  if (!pricePerSqm) return null
  const listPrice = roundMoney(pricePerSqm * input.areaSqm)
  const clientDiscountPercent = tier.clientDiscountPercent
  const clientDiscountAmount = roundMoney((listPrice * clientDiscountPercent) / 100)
  const priceAfterDiscount = listPrice - clientDiscountAmount

  const milestoneScheduleId: MilestoneScheduleId = 'shop_unstarted_100'
  const milestones = buildMilestones(milestoneScheduleId, priceAfterDiscount)

  const upfrontCashDue = milestones[0]?.amount ?? priceAfterDiscount
  const remainingAfterUpfront = priceAfterDiscount - upfrontCashDue

  return {
    currency: CURRENCY,
    propertyKind: 'commercial',
    pricePerSqm,
    floorBandLabel: input.shopFloor,
    unitTypeCode: null,
    listPrice,
    clientDiscountPercent,
    clientDiscountAmount,
    priceAfterDiscount,
    tier,
    upfrontCashDue,
    remainingAfterUpfront,
    milestoneScheduleId,
    milestones,
    notes: ['commercial_no_installments', 'shop_milestone_only'],
  }
}
