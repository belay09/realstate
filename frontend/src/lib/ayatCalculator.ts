import type {
  CommercialZone,
  CompletionKind,
  DownPaymentTier,
  FinishKind,
  MilestoneScheduleId,
  PropertyKind,
} from '../data/ayatCalculatorConfig'
import { unitTypeForBedroomsFinish } from '../data/ayatCalculatorConfig'
import type { CalculatorRuntimeConfig } from './calculatorRuntime'
import { resolveResidentialProjectId } from './calculatorRuntime'

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
  config: CalculatorRuntimeConfig,
  projectId: string,
  unitTypeCode: string,
  finish: FinishKind,
  floor: number,
) {
  const matches = config.residentialPriceRows.filter(
    (r) =>
      r.projectId === projectId &&
      r.unitTypeCode === unitTypeCode &&
      r.finishType === finish &&
      floor >= r.floorBand.floorMin &&
      floor <= r.floorBand.floorMax,
  )
  return matches[0] ?? null
}

export function getTier(config: CalculatorRuntimeConfig, tierId: string): DownPaymentTier | undefined {
  return config.downPaymentTiers.find((t) => t.id === tierId)
}

export function getProject(config: CalculatorRuntimeConfig, projectId: string) {
  return config.residentialProjects.find((p) => p.id === projectId)
}

export function getCommercialZone(
  config: CalculatorRuntimeConfig,
  zoneId: string,
): CommercialZone | undefined {
  return config.commercialZones.find((z) => z.id === zoneId)
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
  config: CalculatorRuntimeConfig,
  scheduleId: MilestoneScheduleId,
  priceAfterDiscount: number,
): MilestoneLine[] {
  const steps = config.milestoneSchedules[scheduleId]
  if (!steps) return []
  return steps.map((s) => ({
    id: s.id,
    labelKey: s.labelKey,
    percent: s.percent,
    amount: roundMoney((priceAfterDiscount * s.percent) / 100),
  }))
}

export function calculateResidential(
  config: CalculatorRuntimeConfig,
  input: ResidentialCalcInput,
): CalculatorResult | null {
  const project = getProject(config, input.projectId)
  const tier = getTier(config, input.tierId)
  if (!project || !tier) return null

  const unitTypeCode = unitTypeForBedroomsFinish(input.bedrooms, input.finish)
  const priceProjectId = resolveResidentialProjectId(input.projectId, input.completion, config)
  const row =
    findResidentialPriceRow(config, input.projectId, unitTypeCode, input.finish, input.floor) ??
    findResidentialPriceRow(config, priceProjectId, unitTypeCode, input.finish, input.floor)

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
    ? buildMilestones(config, milestoneScheduleId, priceAfterDiscount)
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
    currency: config.currency,
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

export function calculateCommercial(
  config: CalculatorRuntimeConfig,
  input: CommercialCalcInput,
): CalculatorResult | null {
  const zone = getCommercialZone(config, input.zoneId)
  const tier = getTier(config, input.tierId)
  if (!zone || !tier) return null

  const pricePerSqm = zone.floors[input.shopFloor]
  if (!pricePerSqm) return null
  const listPrice = roundMoney(pricePerSqm * input.areaSqm)
  const clientDiscountPercent = tier.clientDiscountPercent
  const clientDiscountAmount = roundMoney((listPrice * clientDiscountPercent) / 100)
  const priceAfterDiscount = listPrice - clientDiscountAmount

  const milestoneScheduleId: MilestoneScheduleId = 'shop_unstarted_100'
  const milestones = buildMilestones(config, milestoneScheduleId, priceAfterDiscount)

  const upfrontCashDue = milestones[0]?.amount ?? priceAfterDiscount
  const remainingAfterUpfront = priceAfterDiscount - upfrontCashDue

  return {
    currency: config.currency,
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
