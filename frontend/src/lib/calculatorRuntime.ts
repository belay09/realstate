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
    residentialPriceRows: data.residentialPriceRows.map((r) => ({
      projectId: r.projectId,
      unitTypeCode: r.unitTypeCode,
      finishType: r.finishType,
      floorBand: {
        label: r.floorBand.label,
        floorMin: r.floorBand.floorMin,
        floorMax: r.floorBand.floorMax,
      },
      pricePerSqm: r.pricePerSqm,
    })),
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
