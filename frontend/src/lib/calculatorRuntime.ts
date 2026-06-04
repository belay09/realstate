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
  areaLabelKey: string
  nameKey: string
  maxFloor: number
  supportsCompletionChoice: boolean
  usesStrategyFloorTable?: boolean
}
type ApiZone = {
  id: string
  labelKey: string
  floors: CommercialZone['floors']
}
type ApiTier = {
  id: string
  downPaymentPercent: number
  clientDiscountPercent: number
  labelKey: string
  is6040?: boolean
}
type ApiMilestone = { id: string; labelKey: string; percent: number }

type ApiResidentialRowRaw = ApiResidentialRow & {
  project_id?: string
  unit_type_code?: string
  finish_type?: FinishKind
  price_per_sqm?: number
  floor_band?: { label: string; floor_min?: number; floor_max?: number }
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
    residentialProjects: data.residentialProjects.map((p) => ({
      id: p.id,
      areaLabelKey: p.areaLabelKey,
      nameKey: p.nameKey,
      maxFloor: p.maxFloor,
      supportsCompletionChoice: p.supportsCompletionChoice,
      usesStrategyFloorTable: p.usesStrategyFloorTable,
    })),
    residentialPriceRows: (data.residentialPriceRows ?? []).map((r) =>
      normalizeResidentialRow(r as ApiResidentialRowRaw),
    ),
    commercialZones: data.commercialZones.map((z) => ({
      id: z.id,
      labelKey: z.labelKey,
      floors: z.floors,
    })),
    downPaymentTiers: data.downPaymentTiers.map((t) => ({
      id: t.id,
      downPaymentPercent: t.downPaymentPercent,
      clientDiscountPercent: t.clientDiscountPercent,
      labelKey: t.labelKey,
      is6040: t.is6040,
    })),
    milestoneSchedules: data.milestoneSchedules as Record<MilestoneScheduleId, MilestoneStep[]>,
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
