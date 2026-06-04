import type {
  CommercialZone,
  CompletionKind,
  DownPaymentTier,
  FinishKind,
  MilestoneScheduleId,
  MilestoneStep,
  ResidentialPriceRow,
  ResidentialProject,
} from '../data/ayatCalculatorConfig'

export interface CalculatorRuntimeConfig {
  currency: string
  pricingVersionName: string
  residentialProjects: ResidentialProject[]
  residentialPriceRows: ResidentialPriceRow[]
  commercialZones: CommercialZone[]
  downPaymentTiers: DownPaymentTier[]
  milestoneSchedules: Record<MilestoneScheduleId, MilestoneStep[]>
  bedroomAreaOptions: Record<1 | 2 | 3, number[]>
  commercialAreaMin: number
  commercialAreaMax: number
  commercialAreaPresets: number[]
  inventoryToStrategyLocation: Record<string, string>
}

type ApiFloorBand = { label: string; floorMin: number; floorMax: number }
type ApiResidentialRow = {
  projectId: string
  unitTypeCode: string
  finishType: FinishKind
  floorBand: ApiFloorBand
  pricePerSqm: number
}
type ApiProject = {
  id: string
  areaLabelKey?: string
  nameKey?: string
  maxFloor?: number
  supportsCompletionChoice?: boolean
  usesStrategyFloorTable?: boolean
  area_label_key?: string
  name_key?: string
  max_floor?: number
  supports_completion_choice?: boolean
  uses_strategy_floor_table?: boolean
}
type ApiZone = {
  id: string
  labelKey?: string
  label_key?: string
  floors: CommercialZone['floors']
}
type ApiTier = {
  id: string
  downPaymentPercent?: number
  clientDiscountPercent?: number
  labelKey?: string
  is6040?: boolean
  down_payment_percent?: number
  client_discount_percent?: number
  label_key?: string
  is_6040?: boolean
}
type ApiMilestone = {
  id: string
  labelKey?: string
  label_key?: string
  percent: number
}

type ApiResidentialRowRaw = ApiResidentialRow & {
  project_id?: string
  unit_type_code?: string
  finish_type?: FinishKind
  price_per_sqm?: number
  floor_band?: { label: string; floor_min?: number; floor_max?: number }
}

function normalizeProject(p: ApiProject): ResidentialProject {
  return {
    id: p.id,
    areaLabelKey: p.areaLabelKey ?? p.area_label_key ?? '',
    nameKey: p.nameKey ?? p.name_key ?? '',
    maxFloor: p.maxFloor ?? p.max_floor ?? 1,
    supportsCompletionChoice:
      p.supportsCompletionChoice ?? p.supports_completion_choice ?? false,
    usesStrategyFloorTable: p.usesStrategyFloorTable ?? p.uses_strategy_floor_table,
  }
}

function normalizeZone(z: ApiZone): CommercialZone {
  return {
    id: z.id,
    labelKey: z.labelKey ?? z.label_key ?? z.id,
    floors: z.floors,
  }
}

function normalizeTier(t: ApiTier): DownPaymentTier {
  return {
    id: t.id,
    downPaymentPercent: t.downPaymentPercent ?? t.down_payment_percent ?? 0,
    clientDiscountPercent: t.clientDiscountPercent ?? t.client_discount_percent ?? 0,
    labelKey: t.labelKey ?? t.label_key ?? t.id,
    is6040: t.is6040 ?? t.is_6040,
  }
}

function normalizeMilestoneSchedules(
  raw: Record<string, ApiMilestone[]>,
): Record<MilestoneScheduleId, MilestoneStep[]> {
  const out = {} as Record<MilestoneScheduleId, MilestoneStep[]>
  for (const [scheduleId, steps] of Object.entries(raw)) {
    out[scheduleId as MilestoneScheduleId] = steps.map((s) => ({
      id: s.id,
      labelKey: s.labelKey ?? s.label_key ?? s.id,
      percent: s.percent,
    }))
  }
  return out
}

function normalizeResidentialRow(r: ApiResidentialRowRaw): ApiResidentialRow {
  const band = (r.floorBand ?? r.floor_band) as
    | ApiFloorBand
    | { label: string; floor_min?: number; floor_max?: number }
    | undefined
  const floorMin = band && 'floorMin' in band ? band.floorMin : (band?.floor_min ?? 0)
  const floorMax = band && 'floorMax' in band ? band.floorMax : (band?.floor_max ?? 0)
  return {
    projectId: r.projectId ?? r.project_id ?? '',
    unitTypeCode: r.unitTypeCode ?? r.unit_type_code ?? '',
    finishType: (r.finishType ?? r.finish_type ?? 'semi-finished') as FinishKind,
    floorBand: {
      label: band?.label ?? '',
      floorMin,
      floorMax,
    },
    pricePerSqm: r.pricePerSqm ?? r.price_per_sqm ?? 0,
  }
}

export type PublicCalculatorConfigApi = {
  currency: string
  includesVat: boolean
  pricingVersionId: string
  pricingVersionName: string
  residentialProjects: ApiProject[]
  residentialPriceRows: ApiResidentialRow[]
  commercialZones: ApiZone[]
  downPaymentTiers: ApiTier[]
  milestoneSchedules: Record<string, ApiMilestone[]>
  bedroomAreaOptions: Record<string, number[]>
  commercialAreaMin: number
  commercialAreaMax: number
  commercialAreaPresets: number[]
  inventoryToStrategyLocation: Record<string, string>
}

export function calculatorConfigFromApi(data: PublicCalculatorConfigApi): CalculatorRuntimeConfig {
  const bedroom = data.bedroomAreaOptions
  return {
    currency: data.currency,
    pricingVersionName: data.pricingVersionName,
    residentialProjects: data.residentialProjects.map(normalizeProject),
    residentialPriceRows: (data.residentialPriceRows ?? []).map((r) =>
      normalizeResidentialRow(r as ApiResidentialRowRaw),
    ),
    commercialZones: data.commercialZones.map(normalizeZone),
    downPaymentTiers: data.downPaymentTiers.map(normalizeTier),
    milestoneSchedules: normalizeMilestoneSchedules(data.milestoneSchedules),
    bedroomAreaOptions: {
      1: bedroom['1'] ?? [],
      2: bedroom['2'] ?? [],
      3: bedroom['3'] ?? [],
    },
    commercialAreaMin: data.commercialAreaMin,
    commercialAreaMax: data.commercialAreaMax,
    commercialAreaPresets: data.commercialAreaPresets,
    inventoryToStrategyLocation: data.inventoryToStrategyLocation,
  }
}

export function resolveResidentialProjectId(
  projectId: string,
  completion: CompletionKind,
  config: CalculatorRuntimeConfig,
): string {
  if (projectId === 'cmc-extension') {
    return completion === 'near_completion' ? 'cmc-near-completion' : 'cmc-unstarted'
  }
  return config.inventoryToStrategyLocation[projectId] ?? projectId
}
