import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import type { CompletionKind, FinishKind, PropertyKind } from '../data/ayatCalculatorConfig'
import { useTranslation } from '../context/LocaleContext'
import type { Translator } from '../i18n/translate'
import { useActiveShopLocations } from '../hooks/useActiveShopCommercialZones'
import { useCalculatorConfig } from '../hooks/useCalculatorConfig'
import type { ListingCalculatorPreset } from '../lib/listingCalculatorPreset'
import {
  calculateCommercial,
  calculateResidential,
  calculatorProjectIdFromSlug,
  completionKindsWithRates,
  floorOptionsForResidential,
  hasResidentialRatesForProject,
  resolveCalculatorProject,
  type CalculatorResult,
} from '../lib/ayatCalculator'
import type { CalculatorRuntimeConfig } from '../lib/calculatorRuntime'
import {
  formatBedroomCount,
  formatFloorBandLabel,
  formatShopFloorLabel,
  formatSquareMeters,
  formatUnitTypeLabel,
} from '../lib/ayatLabels'
import { formatMoney } from '../lib/format'
import { shopLocationTitle } from '../lib/shopLocations'

type ShopFloor = 'GF' | '1F' | '2F' | '3F'

const SHOP_FLOORS: ShopFloor[] = ['GF', '1F', '2F', '3F']

/** Indicative apartment calculator uses semi-finished rates only (for now). */
const RESIDENTIAL_FINISH: FinishKind = 'semi-finished'

export type AyatPriceCalculatorProps = {
  variant?: 'page' | 'embedded'
  /** Wizard with large cards, or compact dropdowns with defaults on load */
  layout?: 'wizard' | 'compact'
  listingPreset?: ListingCalculatorPreset | null
  listingTitle?: string
  /** Pre-select apartment or shop (e.g. from /calculator?kind=shop) */
  initialKind?: PropertyKind | null
  /** Pre-select shop zone (e.g. from /shops/ledeta) */
  initialShopZoneId?: string | null
  /** Pre-select apartment project on location pages (e.g. cmc-extension) */
  initialResidentialProjectId?: string | null
}

function defaultAreaSqm(config: CalculatorRuntimeConfig, bedrooms: 1 | 2 | 3): number {
  const areas = config.bedroomAreaOptions[bedrooms]
  const idx = Math.min(1, Math.max(0, areas.length - 1))
  return areas[idx] ?? areas[0]
}

function defaultFloor(
  config: CalculatorRuntimeConfig,
  projectId: string,
  completion: CompletionKind,
  bedrooms: 1 | 2 | 3,
): number {
  const floors = floorOptionsForResidential(config, projectId, completion, bedrooms, RESIDENTIAL_FINISH)
  return floors[Math.floor(floors.length / 2)] ?? floors[0] ?? 5
}

function FormSelect({
  id,
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  id: string
  label: string
  value: string | number
  onChange: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <label className="flex flex-col gap-1.5" htmlFor={id}>
      <span className="text-xs font-medium text-fg-muted">{label}</span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-medium text-fg shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  )
}

function PropertyKindTabs({
  kind,
  onSelect,
}: {
  kind: PropertyKind | null
  onSelect: (next: PropertyKind) => void
}) {
  const { t } = useTranslation()
  return (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      role="tablist"
      aria-label={t('calculator.propertyKindTabsLabel')}
    >
      <p className="text-sm font-medium text-fg">{t('calculator.propertyKindTabsLabel')}</p>
      <div className="inline-flex rounded-xl border border-border bg-surface-muted p-1">
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'residential'}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            kind === 'residential'
              ? 'bg-brand-600 text-white shadow'
              : 'text-fg-muted hover:text-fg'
          }`}
          onClick={() => onSelect('residential')}
        >
          {t('calculator.apartmentTab')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'commercial'}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            kind === 'commercial'
              ? 'bg-brand-600 text-white shadow'
              : 'text-fg-muted hover:text-fg'
          }`}
          onClick={() => onSelect('commercial')}
        >
          {t('calculator.shopTab')}
        </button>
      </div>
    </div>
  )
}

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        active
          ? 'bg-brand-600 text-white'
          : done
            ? 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200'
            : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      {n}
    </span>
  )
}

function ChoiceButton({
  selected,
  onClick,
  disabled,
  children,
}: {
  selected: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
        disabled
          ? 'cursor-not-allowed border-border bg-surface-muted text-fg-muted opacity-50'
          : selected
            ? 'border-brand-500 bg-brand-50 font-semibold text-brand-900 ring-2 ring-brand-500/30 dark:bg-brand-950 dark:text-brand-100'
            : 'border-border bg-surface hover:border-brand-300'
      }`}
    >
      {children}
    </button>
  )
}

function DiscountStepTotals({
  totalLabel,
  total,
  rateLabel,
  ratePerSqm,
  currency,
  t,
  tone,
}: {
  totalLabel: string
  total: number
  rateLabel: string
  ratePerSqm: number
  currency: string
  t: Translator
  tone: 'emerald' | 'amber'
}) {
  if (ratePerSqm <= 0) return null
  const toneBorder =
    tone === 'emerald'
      ? 'border-emerald-200/80 dark:border-emerald-800/50'
      : 'border-amber-200/80 dark:border-amber-800/50'
  const toneText =
    tone === 'emerald'
      ? 'text-emerald-900 dark:text-emerald-100'
      : 'text-amber-900 dark:text-amber-100'
  return (
    <div className={`mt-3 space-y-2 border-t pt-3 ${toneBorder}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <dt className={`text-xs font-medium ${toneText}`}>{totalLabel}</dt>
        <dd className={`text-sm font-semibold ${toneText}`}>{formatMoney(total, currency)}</dd>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <dt className={`text-xs ${toneText} opacity-90`}>{rateLabel}</dt>
        <dd className={`text-base font-bold ${toneText}`}>
          {formatMoney(ratePerSqm, currency)}
          <span className="ml-1 text-xs font-normal opacity-80">{t('calculator.perSquareMeter')}</span>
        </dd>
      </div>
    </div>
  )
}

function CalculatorResults({
  result,
  kind,
  canShowResult,
  step5Done,
  compact,
}: {
  result: CalculatorResult | null
  kind: PropertyKind | null
  canShowResult: boolean
  step5Done: boolean
  compact?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div
      className={
        compact
          ? 'rounded-2xl border border-brand-200/70 bg-gradient-to-b from-brand-50/90 to-surface p-5 shadow-sm dark:border-brand-800/50 dark:from-brand-950/60'
          : 'card border-brand-200/60 bg-gradient-to-b from-brand-50/80 to-surface p-6 dark:border-brand-800/40 dark:from-brand-950/50'
      }
    >
      <h3 className="text-lg font-bold text-fg">{t('calculator.resultTitle')}</h3>
      {!canShowResult && (
        <p className="mt-4 text-sm text-fg-muted">
          {compact ? t('calculator.compactAdjustHint') : t('calculator.resultPending')}
        </p>
      )}
      {canShowResult && result && (
        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="text-fg-muted">{t('calculator.pricePerSqm')}</dt>
            <dd className="text-xl font-bold text-fg">
              {formatMoney(result.pricePerSqm, result.currency)}
              <span className="text-sm font-normal text-fg-muted">
                {' '}
                {t('calculator.perSquareMeter')}
              </span>
            </dd>
            {result.floorBandLabel && (
              <p className="mt-1 text-xs text-fg-muted">
                {kind === 'residential'
                  ? t('calculator.floorBand', {
                      band: formatFloorBandLabel(result.floorBandLabel, t),
                    })
                  : t('calculator.shopFloorSelected', {
                      floor: formatShopFloorLabel(result.floorBandLabel, t),
                    })}
              </p>
            )}
            {result.unitTypeCode && (
              <p className="text-xs text-fg-muted">
                {t('calculator.unitType', {
                  label: formatUnitTypeLabel(result.unitTypeCode, t),
                })}
              </p>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <dt className="text-fg-muted">{t('calculator.listPrice')}</dt>
            <dd className="font-semibold text-fg">
              {formatMoney(result.listPrice, result.currency)}
            </dd>
            <p className="mt-1 text-xs text-fg-muted">{t('calculator.listPriceHint')}</p>
          </div>

          <div className="rounded-lg bg-emerald-50 px-3 py-3 dark:bg-emerald-950/40">
            <dt className="font-medium text-emerald-900 dark:text-emerald-200">
              {t('calculator.clientDiscount')}
            </dt>
            <dd className="mt-1 text-emerald-900 dark:text-emerald-100">
              <span className="text-lg font-bold">−{result.clientDiscountPercent}%</span>
              <span className="ml-2">
                ({formatMoney(result.clientDiscountAmount, result.currency)})
              </span>
            </dd>
            <p className="mt-2 text-xs text-emerald-800/90 dark:text-emerald-200/80">
              {t('calculator.clientDiscountHint')}
            </p>
            <DiscountStepTotals
              totalLabel={t('calculator.totalAfterTier')}
              total={result.priceAfterTierDiscount}
              rateLabel={t('calculator.pricePerSqmAfterTier')}
              ratePerSqm={result.effectivePricePerSqmAfterTier}
              currency={result.currency}
              t={t}
              tone="emerald"
            />
          </div>

          {result.locationPromotion ? (
            <div className="rounded-lg bg-amber-50 px-3 py-3 dark:bg-amber-950/40">
              <dt className="font-medium text-amber-900 dark:text-amber-200">
                {t('calculator.locationPromotion', { name: result.locationPromotion.name })}
              </dt>
              <dd className="mt-1 text-amber-900 dark:text-amber-100">
                <span className="text-lg font-bold">−{result.locationPromotion.percent}%</span>
                <span className="ml-2">
                  ({formatMoney(result.locationPromotion.amount, result.currency)})
                </span>
              </dd>
              <p className="mt-2 text-xs text-amber-800/90 dark:text-amber-200/80">
                {t('calculator.locationPromotionHint')}
              </p>
              <DiscountStepTotals
                totalLabel={t('calculator.totalAfterPromotion')}
                total={result.priceAfterDiscount}
                rateLabel={t('calculator.pricePerSqmAfterPromotion')}
                ratePerSqm={result.effectivePricePerSqm}
                currency={result.currency}
                t={t}
                tone="amber"
              />
            </div>
          ) : null}

          <div className="rounded-xl border-2 border-brand-300/70 bg-brand-50/80 px-4 py-4 dark:border-brand-700/50 dark:bg-brand-950/40">
            <dt className="text-sm font-semibold text-brand-900 dark:text-brand-100">
              {t('calculator.finalSummaryTitle')}
            </dt>
            <dd className="mt-2 text-2xl font-bold text-brand-800 dark:text-brand-200">
              {formatMoney(result.priceAfterDiscount, result.currency)}
            </dd>
            <p className="text-xs font-medium text-fg-muted">{t('calculator.priceAfterDiscount')}</p>
            {result.areaSqm > 0 && result.effectivePricePerSqm > 0 ? (
              <>
                <dd className="mt-3 text-xl font-bold text-brand-800 dark:text-brand-200">
                  {formatMoney(result.effectivePricePerSqm, result.currency)}
                  <span className="text-sm font-normal text-fg-muted">
                    {' '}
                    {t('calculator.perSquareMeter')}
                  </span>
                </dd>
                <p className="text-xs text-fg-muted">{t('calculator.effectivePricePerSqmFinal')}</p>
                <p className="mt-2 text-xs text-fg-muted">
                  {t('calculator.effectivePricePerSqmSummary', {
                    area: formatSquareMeters(result.areaSqm, t),
                    listRate: formatMoney(result.pricePerSqm, result.currency),
                    tierRate: formatMoney(result.effectivePricePerSqmAfterTier, result.currency),
                    finalRate: formatMoney(result.effectivePricePerSqm, result.currency),
                  })}
                </p>
              </>
            ) : null}
          </div>

          {result.tier.is6040 ? (
            <div className="border-t border-border pt-4">
              <dt className="font-medium text-fg">{t('calculator.downPayment6040')}</dt>
              <dd className="mt-1 font-semibold">
                {formatMoney(result.upfrontCashDue, result.currency)}
                <span className="text-fg-muted"> (40%)</span>
              </dd>
              <dd className="mt-2 text-fg-muted">
                {t('calculator.balance6040')}:{' '}
                <span className="font-semibold text-fg">
                  {formatMoney(result.remainingAfterUpfront, result.currency)}
                </span>
              </dd>
            </div>
          ) : (
            <div className="border-t border-border pt-4">
              <dt className="font-medium text-fg">
                {result.milestones.length > 0
                  ? t('calculator.firstMilestone')
                  : t('calculator.downPaymentNow')}
              </dt>
              <dd className="mt-1 text-lg font-semibold text-fg">
                {formatMoney(result.upfrontCashDue, result.currency)}
              </dd>
              {result.remainingAfterUpfront > 0 && result.milestones.length === 0 && (
                <dd className="mt-1 text-xs text-fg-muted">
                  {t('calculator.remainingBalance')}:{' '}
                  {formatMoney(result.remainingAfterUpfront, result.currency)}
                </dd>
              )}
            </div>
          )}

          {result.milestones.length > 0 && (
            <div className="border-t border-border pt-4">
              <dt className="mb-2 font-medium text-fg">{t('calculator.milestoneTitle')}</dt>
              <ul className="space-y-2">
                {result.milestones.map((m) => (
                  <li key={m.id} className="flex justify-between gap-2 text-xs sm:text-sm">
                    <span className="text-fg-muted">
                      {t(m.labelKey)} ({m.percent}%)
                    </span>
                    <span className="font-medium text-fg">
                      {formatMoney(m.amount, result.currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-fg-muted">{t('calculator.milestoneHint')}</p>
            </div>
          )}

          {result.notes.includes('commercial_no_installments') && (
            <p className="rounded-md border border-border bg-slate-50 px-3 py-2 text-xs text-fg-muted dark:bg-slate-900">
              {t('calculator.shopNoInstallments')}
            </p>
          )}

          {result.notes.includes('one_bed_indicative') && (
            <p className="text-xs text-fg-muted">{t('calculator.oneBedNote')}</p>
          )}
        </dl>
      )}
      {!canShowResult && step5Done && !result && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          {t('calculator.noPriceForSelection')}
        </p>
      )}
    </div>
  )
}

function selectKind(
  next: PropertyKind,
  setters: {
    setKind: (k: PropertyKind) => void
    setProjectId: (v: string | null) => void
    setShopZoneId: (v: string | null) => void
    setShopFloor: (v: ShopFloor | null) => void
    setBedrooms: (v: 1 | 2 | 3 | null) => void
    setFloor: (v: number | null) => void
    setAreaSqm: (v: number | null) => void
  },
) {
  setters.setKind(next)
  if (next === 'residential') {
    setters.setShopZoneId(null)
    setters.setShopFloor(null)
  } else {
    setters.setProjectId(null)
    setters.setBedrooms(null)
    setters.setFloor(null)
    setters.setAreaSqm(null)
  }
}

export function AyatPriceCalculator({
  variant = 'page',
  layout,
  listingPreset = null,
  listingTitle,
  initialKind = null,
  initialShopZoneId = null,
  initialResidentialProjectId = null,
}: AyatPriceCalculatorProps) {
  const { t } = useTranslation()
  const {
    data: config,
    isPending: configLoading,
    isError: configError,
    isSuccess: configReady,
  } = useCalculatorConfig()
  const shopLocations = useActiveShopLocations(config)
  const embedded = variant === 'embedded'
  const isCompact = layout === 'compact' || (layout !== 'wizard' && !embedded)
  const lockResidentialProject = Boolean(initialResidentialProjectId)
  const preset = listingPreset ?? undefined
  const defaultsApplied = useRef(false)

  const [kind, setKind] = useState<PropertyKind | null>(
    preset?.propertyKind ??
      initialKind ??
      (initialResidentialProjectId ? 'residential' : null),
  )
  const [projectId, setProjectId] = useState<string | null>(
    preset?.projectId ?? initialResidentialProjectId ?? null,
  )
  const [completion, setCompletion] = useState<CompletionKind>(preset?.completion ?? 'unstarted')
  const [bedrooms, setBedrooms] = useState<1 | 2 | 3 | null>(
    preset?.bedrooms ?? (initialResidentialProjectId ? 3 : null),
  )
  const [areaSqm, setAreaSqm] = useState<number | null>(preset?.areaSqm ?? null)
  const [floor, setFloor] = useState<number | null>(preset?.floor ?? null)
  const [shopZoneId, setShopZoneId] = useState<string | null>(null)
  const [shopFloor, setShopFloor] = useState<ShopFloor | null>(null)
  const [tierId, setTierId] = useState<string>(
    preset ? '100' : initialResidentialProjectId && variant === 'page' ? '40' : '100',
  )

  useEffect(() => {
    if (!preset && initialKind && kind == null) {
      setKind(initialKind)
    }
  }, [preset, initialKind, kind])

  useEffect(() => {
    if (!preset && initialResidentialProjectId && kind === 'residential') {
      setProjectId(initialResidentialProjectId)
    }
  }, [preset, initialResidentialProjectId, kind])

  useEffect(() => {
    if (!preset && initialShopZoneId) {
      setKind('commercial')
      setShopZoneId(initialShopZoneId)
      const zone = shopLocations.find((z) => z.id === initialShopZoneId)
      if (zone) {
        const first = SHOP_FLOORS.find((f) => zone.floors[f] > 0)
        if (first) setShopFloor(first)
      }
    }
  }, [preset, initialShopZoneId, shopLocations])

  useEffect(() => {
    if (!isCompact || preset || configLoading || !configReady || defaultsApplied.current) return

    const applyResidential = (pid: string) => {
      const resolved = calculatorProjectIdFromSlug(config, pid)
      const proj = resolveCalculatorProject(config, resolved)
      if (!proj) return
      setKind('residential')
      setProjectId(resolved)
      setBedrooms(3)
      setAreaSqm(defaultAreaSqm(config, 3))
      setFloor(defaultFloor(config, resolved, 'unstarted', 3))
      setCompletion('unstarted')
      setTierId('40')
    }

    const applyCommercial = (zoneId: string) => {
      const zone = shopLocations.find((z) => z.id === zoneId)
      if (!zone) return
      setKind('commercial')
      setShopZoneId(zoneId)
      const first = SHOP_FLOORS.find((f) => zone.floors[f] > 0) ?? 'GF'
      setShopFloor(first)
      const presets = config.commercialAreaPresets
      setAreaSqm(presets[Math.min(2, presets.length - 1)] ?? presets[0] ?? 50)
      setTierId('100')
    }

    if (initialResidentialProjectId) {
      applyResidential(initialResidentialProjectId)
    } else if (initialKind === 'commercial' && initialShopZoneId) {
      applyCommercial(initialShopZoneId)
    } else if (initialKind === 'commercial' && shopLocations[0]) {
      applyCommercial(shopLocations[0].id)
    } else if (initialKind === 'residential' || initialKind == null) {
      const first = config.residentialProjects[0]
      if (first) applyResidential(first.id)
    }

    defaultsApplied.current = true
  }, [
    isCompact,
    preset,
    configLoading,
    configReady,
    config,
    initialResidentialProjectId,
    initialKind,
    initialShopZoneId,
    shopLocations,
  ])

  const project = projectId ? resolveCalculatorProject(config, projectId) : undefined
  const presetProject = preset
    ? resolveCalculatorProject(config, preset.projectId)
    : null

  const completionChoices = useMemo(() => {
    if (!projectId || bedrooms == null || !project?.supportsCompletionChoice) return []
    return completionKindsWithRates(config, projectId, bedrooms, RESIDENTIAL_FINISH)
  }, [config, projectId, bedrooms, project?.supportsCompletionChoice])

  const effectiveCompletion: CompletionKind =
    completionChoices.length > 0
      ? completionChoices.includes(completion)
        ? completion
        : completionChoices[0]
      : completion

  const residentialFloors = useMemo(() => {
    if (!projectId || bedrooms == null) return []
    return floorOptionsForResidential(
      config,
      projectId,
      effectiveCompletion,
      bedrooms,
      RESIDENTIAL_FINISH,
    )
  }, [config, projectId, effectiveCompletion, bedrooms])

  useEffect(() => {
    if (completionChoices.length === 0) return
    if (!completionChoices.includes(completion)) {
      setCompletion(completionChoices[0])
    }
  }, [completionChoices, completion])

  useEffect(() => {
    if (kind !== 'residential' || residentialFloors.length === 0) return
    if (floor == null || !residentialFloors.includes(floor)) {
      setFloor(residentialFloors[Math.floor(residentialFloors.length / 2)] ?? residentialFloors[0])
    }
  }, [kind, residentialFloors, floor])
  const selectedShopZone = shopLocations.find((z) => z.id === shopZoneId)
  const shopFloorsAvailable = SHOP_FLOORS.filter(
    (f) => selectedShopZone && selectedShopZone.floors[f] > 0,
  )

  const result = useMemo(() => {
    if (kind === 'residential') {
      if (!projectId || bedrooms == null || areaSqm == null || floor == null) {
        return null
      }
      return calculateResidential(config, {
        projectId,
        bedrooms,
        finish: RESIDENTIAL_FINISH,
        areaSqm,
        floor,
        completion: effectiveCompletion,
        tierId,
      })
    }
    if (kind === 'commercial') {
      if (!shopZoneId || !shopFloor || areaSqm == null) return null
      return calculateCommercial(config, { zoneId: shopZoneId, shopFloor, areaSqm, tierId }, shopLocations)
    }
    return null
  }, [
    config,
    kind,
    projectId,
    bedrooms,
    areaSqm,
    floor,
    effectiveCompletion,
    tierId,
    shopZoneId,
    shopFloor,
    shopLocations,
  ])

  const step1Done = kind != null
  const step2Done =
    kind === 'residential' ? projectId != null : kind === 'commercial' ? shopZoneId != null : false
  const step3Done =
    kind === 'residential'
      ? bedrooms != null
      : kind === 'commercial'
        ? shopFloor != null
        : false
  const step4Done = areaSqm != null
  const step5Done =
    kind === 'residential' ? floor != null : kind === 'commercial' ? true : false

  const canShowResult = step1Done && step2Done && step3Done && step4Done && step5Done && result

  const residentialRatesReady =
    configReady &&
    kind === 'residential' &&
    projectId != null &&
    bedrooms != null &&
    hasResidentialRatesForProject(
      config,
      projectId,
      effectiveCompletion,
      bedrooms,
      RESIDENTIAL_FINISH,
    )

  const areaOptions =
    bedrooms != null ? config.bedroomAreaOptions[bedrooms] : config.commercialAreaPresets

  const showFullWizard = !embedded && !isCompact
  let stepCounter = 0

  const compactForm = isCompact && (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      {configLoading ? (
        <p className="mb-5 text-sm text-fg-muted">{t('calculator.loadingRates')}</p>
      ) : configReady && kind === 'residential' && projectId && bedrooms != null && !residentialRatesReady ? (
        <p className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
          {t('calculator.noRatesLoaded')}
        </p>
      ) : (
        <p className="mb-5 text-sm text-fg-muted">{t('calculator.compactAdjustHint')}</p>
      )}

      {!lockResidentialProject && !initialKind && (
        <div className="mb-5">
          <PropertyKindTabs
            kind={kind}
            onSelect={(next) =>
              selectKind(next, {
                setKind,
                setProjectId,
                setShopZoneId,
                setShopFloor,
                setBedrooms,
                setFloor,
                setAreaSqm,
              })
            }
          />
        </div>
      )}

      {lockResidentialProject && project && (
        <p className="mb-4 text-sm font-semibold text-fg">
          {t(project.nameKey)}
          <span className="ml-2 font-normal text-fg-muted">· {t(project.areaLabelKey)}</span>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kind === 'residential' && !lockResidentialProject && (
          <FormSelect
            id="calc-area"
            label={t('calculator.compactFieldArea')}
            value={projectId ?? ''}
            onChange={(v) => {
              setProjectId(v)
              if (bedrooms != null) {
                setFloor(defaultFloor(config, v, completion, bedrooms))
              } else {
                setFloor(null)
              }
            }}
          >
            <option value="" disabled>
              —
            </option>
            {config.residentialProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {t(p.nameKey)}
              </option>
            ))}
          </FormSelect>
        )}

        {kind === 'commercial' && (
          <FormSelect
            id="calc-shop-zone"
            label={t('calculator.compactFieldShopZone')}
            value={shopZoneId ?? ''}
            onChange={(v) => {
              setShopZoneId(v)
              const zone = shopLocations.find((z) => z.id === v)
              const first = zone
                ? SHOP_FLOORS.find((f) => zone.floors[f] > 0)
                : undefined
              setShopFloor(first ?? null)
            }}
          >
            <option value="" disabled>
              —
            </option>
            {shopLocations.map((z) => (
              <option key={z.id} value={z.id}>
                {shopLocationTitle(z, t)}
              </option>
            ))}
          </FormSelect>
        )}

        {kind === 'residential' && completionChoices.length > 1 && (
          <FormSelect
            id="calc-completion"
            label={t('calculator.compactFieldCompletion')}
            value={effectiveCompletion}
            onChange={(v) => setCompletion(v as CompletionKind)}
          >
            {completionChoices.includes('unstarted') ? (
              <option value="unstarted">{t('calculator.completionUnstarted')}</option>
            ) : null}
            {completionChoices.includes('near_completion') ? (
              <option value="near_completion">{t('calculator.completionNear')}</option>
            ) : null}
          </FormSelect>
        )}

        {kind === 'residential' && (
          <>
            <FormSelect
              id="calc-bedrooms"
              label={t('calculator.compactFieldBedrooms')}
              value={bedrooms ?? ''}
              onChange={(v) => {
                const b = Number(v) as 1 | 2 | 3
                setBedrooms(b)
                setAreaSqm(defaultAreaSqm(config, b))
              }}
            >
              {([1, 2, 3] as const).map((b) => (
                <option key={b} value={b}>
                  {formatBedroomCount(b, t)}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              id="calc-finish"
              label={t('calculator.compactFieldFinish')}
              value={RESIDENTIAL_FINISH}
              disabled
              onChange={() => {}}
            >
              <option value="semi-finished">{t('calculator.finishSemi')}</option>
            </FormSelect>
          </>
        )}

        {kind === 'commercial' && shopZoneId && (
          <FormSelect
            id="calc-shop-floor"
            label={t('calculator.compactFieldShopFloor')}
            value={shopFloor ?? ''}
            onChange={(v) => setShopFloor(v as ShopFloor)}
          >
            {(shopFloorsAvailable.length > 0 ? shopFloorsAvailable : SHOP_FLOORS).map((f) => (
              <option
                key={f}
                value={f}
                disabled={selectedShopZone != null && selectedShopZone.floors[f] === 0}
              >
                {t(`calculator.shopFloor.${f}`)}
              </option>
            ))}
          </FormSelect>
        )}

        {kind && bedrooms != null && kind === 'residential' && (
          <FormSelect
            id="calc-size"
            label={t('calculator.compactFieldSize')}
            value={areaSqm ?? ''}
            onChange={(v) => setAreaSqm(Number(v))}
          >
            {areaOptions.map((a) => (
              <option key={a} value={a}>
                {formatSquareMeters(a, t)}
              </option>
            ))}
          </FormSelect>
        )}

        {kind === 'commercial' && shopFloor && (
          <FormSelect
            id="calc-shop-size"
            label={t('calculator.compactFieldSize')}
            value={areaSqm ?? ''}
            onChange={(v) => setAreaSqm(Number(v))}
          >
            {config.commercialAreaPresets.map((a) => (
              <option key={a} value={a}>
                {formatSquareMeters(a, t)}
              </option>
            ))}
          </FormSelect>
        )}

        {kind === 'residential' && project && areaSqm != null && residentialRatesReady && (
          <FormSelect
            id="calc-floor"
            label={t('calculator.compactFieldFloor')}
            value={floor ?? ''}
            onChange={(v) => setFloor(Number(v))}
            disabled={residentialFloors.length === 0}
          >
            {residentialFloors.length === 0 ? (
              <option value="">{t('calculator.noFloorsForRates')}</option>
            ) : null}
            {residentialFloors.map((f) => (
              <option key={f} value={f}>
                {t('calculator.floorN', { n: f })}
              </option>
            ))}
          </FormSelect>
        )}

        {kind && step5Done && (
          <FormSelect
            id="calc-tier"
            label={t('calculator.compactFieldPayment')}
            value={tierId}
            onChange={setTierId}
          >
            {config.downPaymentTiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {t(tier.labelKey)} — {t('calculator.tierDiscount', { percent: tier.clientDiscountPercent })}
              </option>
            ))}
          </FormSelect>
        )}
      </div>

      <p className="mt-4 rounded-lg border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        {t('calculator.compactDisclaimer')}
      </p>
    </div>
  )
  const nextStep = () => {
    stepCounter += 1
    return stepCounter
  }

  const paymentSection = (
    <section className={embedded ? 'surface p-6 sm:p-8' : 'card p-6'}>
      <div className="mb-4 flex items-center gap-3">
        {embedded ? (
          <StepBadge n={2} active={false} done />
        ) : (
          <StepBadge n={6} active={false} done={step5Done} />
        )}
        <h2 className="text-lg font-bold text-fg">
          {embedded ? t('calculator.embeddedPaymentTitle') : t('calculator.step6PaymentTitle')}
        </h2>
      </div>
      {embedded ? (
        <p className="mb-4 text-sm text-fg-muted">{t('calculator.embeddedPaymentHint')}</p>
      ) : (
        <p className="mb-4 text-sm text-fg-muted">{t('calculator.step6PaymentHint')}</p>
      )}
      <div className="space-y-2">
        {config.downPaymentTiers.map((tier) => (
          <label
            key={tier.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 ${
              tierId === tier.id
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                : 'border-border'
            }`}
          >
            <input
              type="radio"
              name={embedded ? 'tier-embedded' : 'tier'}
              className="mt-1"
              checked={tierId === tier.id}
              onChange={() => setTierId(tier.id)}
            />
            <span>
              <span className="block text-sm font-semibold text-fg">{t(tier.labelKey)}</span>
              <span className="block text-xs text-fg-muted">
                {t('calculator.tierDiscount', { percent: tier.clientDiscountPercent })}
              </span>
            </span>
          </label>
        ))}
      </div>
    </section>
  )

  const embeddedAdjustSection = embedded && preset && presetProject && (
    <section className="surface p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-3">
        <StepBadge n={1} active={false} done />
        <h2 className="text-lg font-bold text-fg">{t('calculator.embeddedAdjustTitle')}</h2>
      </div>
      <p className="mb-4 text-sm text-fg-muted">{t('calculator.embeddedAdjustHint')}</p>

      {completionChoices.length > 1 && (
        <div className="mb-5 space-y-2">
          <p className="text-sm font-medium text-fg">{t('calculator.completionLabel')}</p>
          <div className="flex flex-wrap gap-2">
            {completionChoices.includes('unstarted') ? (
              <ChoiceButton
                selected={effectiveCompletion === 'unstarted'}
                onClick={() => setCompletion('unstarted')}
              >
                {t('calculator.completionUnstarted')}
              </ChoiceButton>
            ) : null}
            {completionChoices.includes('near_completion') ? (
              <ChoiceButton
                selected={effectiveCompletion === 'near_completion'}
                onClick={() => setCompletion('near_completion')}
              >
                {t('calculator.completionNear')}
              </ChoiceButton>
            ) : null}
          </div>
        </div>
      )}

      <p className="mb-2 text-sm font-medium text-fg">{t('calculator.step4SizeTitle')}</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {config.bedroomAreaOptions[preset.bedrooms].map((a) => (
          <ChoiceButton key={a} selected={areaSqm === a} onClick={() => setAreaSqm(a)}>
            {formatSquareMeters(a, t)}
          </ChoiceButton>
        ))}
      </div>

      <p className="mb-2 text-sm font-medium text-fg">{t('calculator.step5FloorTitle')}</p>
      <div className="flex flex-wrap gap-2">
        {(preset && bedrooms != null
          ? floorOptionsForResidential(
              config,
              preset.projectId,
              effectiveCompletion,
              bedrooms,
              RESIDENTIAL_FINISH,
            )
          : residentialFloors
        ).map((f) => (
          <ChoiceButton key={f} selected={floor === f} onClick={() => setFloor(f)}>
            {t('calculator.floorN', { n: f })}
          </ChoiceButton>
        ))}
      </div>
    </section>
  )

  const wizardColumn = (
    <div className="space-y-8">
      {isCompact && compactForm}
      {showFullWizard && (
        <>
          {embedded ? (
            <section className="card p-6">
              <PropertyKindTabs
                kind={kind}
                onSelect={(next) =>
                  selectKind(next, {
                    setKind,
                    setProjectId,
                    setShopZoneId,
                    setShopFloor,
                    setBedrooms,
                    setFloor,
                    setAreaSqm,
                  })
                }
              />
              <p className="mt-4 text-sm text-fg-muted">
                {kind === 'commercial'
                  ? t('calculator.shopLocationsHint')
                  : kind === 'residential'
                    ? t('calculator.apartmentLocationsHint')
                    : t('calculator.propertyKindPickHint')}
              </p>
            </section>
          ) : null}

          {kind === 'residential' && (
            <section className="card p-6">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={nextStep()} active={step1Done && !step2Done} done={step2Done} />
                <div>
                  <h2 className="text-lg font-bold text-fg">{t('calculator.step2AreaTitle')}</h2>
                  <p className="mt-1 text-sm text-fg-muted">{t('calculator.apartmentLocationsHint')}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {config.residentialProjects.map((p) => (
                  <ChoiceButton
                    key={p.id}
                    selected={projectId === p.id}
                    onClick={() => {
                      setProjectId(p.id)
                      setFloor(null)
                    }}
                  >
                    <span className="font-semibold">{t(p.nameKey)}</span>
                    <span className="mt-1 block text-xs font-normal text-fg-muted">
                      {t(p.areaLabelKey)}
                    </span>
                  </ChoiceButton>
                ))}
              </div>
              {completionChoices.length > 1 && (
                <div className="mt-5 space-y-2">
                  <p className="text-sm font-medium text-fg">{t('calculator.completionLabel')}</p>
                  <div className="flex flex-wrap gap-2">
                    {completionChoices.includes('unstarted') ? (
                      <ChoiceButton
                        selected={effectiveCompletion === 'unstarted'}
                        onClick={() => setCompletion('unstarted')}
                      >
                        {t('calculator.completionUnstarted')}
                      </ChoiceButton>
                    ) : null}
                    {completionChoices.includes('near_completion') ? (
                      <ChoiceButton
                        selected={effectiveCompletion === 'near_completion'}
                        onClick={() => setCompletion('near_completion')}
                      >
                        {t('calculator.completionNear')}
                      </ChoiceButton>
                    ) : null}
                  </div>
                  <p className="text-xs text-fg-muted">{t('calculator.completionHint')}</p>
                </div>
              )}
            </section>
          )}

          {kind === 'commercial' && (
            <section className="card p-6">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={nextStep()} active={step1Done && !step2Done} done={step2Done} />
                <div>
                  <h2 className="text-lg font-bold text-fg">{t('calculator.step2ShopZoneTitle')}</h2>
                  <p className="mt-1 text-sm text-fg-muted">{t('calculator.shopLocationsHint')}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {shopLocations.map((z) => (
                  <ChoiceButton
                    key={z.id}
                    selected={shopZoneId === z.id}
                    onClick={() => {
                      setShopZoneId(z.id)
                      setShopFloor(null)
                    }}
                  >
                    {shopLocationTitle(z, t)}
                  </ChoiceButton>
                ))}
              </div>
            </section>
          )}

          {kind === 'residential' && projectId && (
            <section className="card p-6">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={nextStep()} active={step2Done && !step3Done} done={step3Done} />
                <h2 className="text-lg font-bold text-fg">{t('calculator.step3BedTitle')}</h2>
              </div>
              <p className="mb-3 text-sm text-fg-muted">{t('calculator.step3BedHint')}</p>
              <div className="mb-5 flex flex-wrap gap-2">
                {([1, 2, 3] as const).map((b) => (
                  <ChoiceButton
                    key={b}
                    selected={bedrooms === b}
                    onClick={() => {
                      setBedrooms(b)
                      setAreaSqm(null)
                    }}
                  >
                    {formatBedroomCount(b, t)}
                  </ChoiceButton>
                ))}
              </div>
              {bedrooms != null && (
                <p className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-fg-muted">
                  <span className="font-medium text-fg">{t('calculator.finishLabel')}:</span>{' '}
                  {t('calculator.finishSemi')}
                  <span className="mt-1 block text-xs">{t('calculator.finishLockedHint')}</span>
                </p>
              )}
            </section>
          )}

          {kind === 'commercial' && shopZoneId && (
            <section className="card p-6">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={nextStep()} active={step2Done && !step3Done} done={step3Done} />
                <h2 className="text-lg font-bold text-fg">{t('calculator.step3ShopFloorTitle')}</h2>
              </div>
              <p className="mb-3 text-sm text-fg-muted">{t('calculator.step3ShopFloorHint')}</p>
              <div className="flex flex-wrap gap-2">
                {(shopFloorsAvailable.length > 0 ? shopFloorsAvailable : SHOP_FLOORS).map((f) => (
                  <ChoiceButton
                    key={f}
                    selected={shopFloor === f}
                    onClick={() => setShopFloor(f)}
                    disabled={selectedShopZone != null && selectedShopZone.floors[f] === 0}
                  >
                    {t(`calculator.shopFloor.${f}`)}
                  </ChoiceButton>
                ))}
              </div>
              {selectedShopZone?.id === 'bole-air' && (
                <p className="mt-2 text-xs text-fg-muted">{t('calculator.boleAirGroundOnly')}</p>
              )}
            </section>
          )}

          {kind &&
            ((kind === 'residential' && bedrooms != null) ||
              (kind === 'commercial' && shopFloor != null)) && (
              <section className="card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <StepBadge n={nextStep()} active={step3Done && !step4Done} done={step4Done} />
                  <h2 className="text-lg font-bold text-fg">{t('calculator.step4SizeTitle')}</h2>
                </div>
                <p className="mb-3 text-sm text-fg-muted">{t('calculator.step4SizeHint')}</p>
                <div className="flex flex-wrap gap-2">
                  {areaOptions.map((a) => (
                    <ChoiceButton key={a} selected={areaSqm === a} onClick={() => setAreaSqm(a)}>
                      {formatSquareMeters(a, t)}
                    </ChoiceButton>
                  ))}
                </div>
                {kind === 'commercial' && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-fg" htmlFor="shop-area">
                      {t('calculator.customSize')}
                    </label>
                    <input
                      id="shop-area"
                      type="number"
                      min={config.commercialAreaMin}
                      max={config.commercialAreaMax}
                      value={areaSqm ?? ''}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        if (!Number.isNaN(v)) setAreaSqm(v)
                      }}
                      className="mt-2 w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    />
                    <p className="mt-1 text-xs text-fg-muted">
                      {t('calculator.shopSizeRange', {
                        min: config.commercialAreaMin,
                        max: config.commercialAreaMax,
                      })}
                    </p>
                  </div>
                )}
              </section>
            )}

          {kind === 'residential' && areaSqm != null && project && (
            <section className="card p-6">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={nextStep()} active={step4Done && !step5Done} done={step5Done} />
                <h2 className="text-lg font-bold text-fg">{t('calculator.step5FloorTitle')}</h2>
              </div>
              <p className="mb-3 text-sm text-fg-muted">{t('calculator.step5FloorHint')}</p>
              <div className="flex flex-wrap gap-2">
                {residentialFloors.map((f) => (
                  <ChoiceButton key={f} selected={floor === f} onClick={() => setFloor(f)}>
                    {t('calculator.floorN', { n: f })}
                  </ChoiceButton>
                ))}
              </div>
            </section>
          )}

          {step5Done && paymentSection}
        </>
      )}

      {embedded && embeddedAdjustSection}
      {embedded && paymentSection}
    </div>
  )

  return (
    <div
      className={
        embedded
          ? 'space-y-6 text-left'
          : isCompact
            ? 'mx-auto max-w-5xl space-y-6 text-left'
            : 'mx-auto max-w-5xl space-y-10 text-left'
      }
    >
      {!embedded && isCompact && !lockResidentialProject && (
        <header className="space-y-2">
          <p className="text-eyebrow text-brand-700 dark:text-brand-300">{t('calculator.eyebrow')}</p>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {t('calculator.title')}
          </h1>
        </header>
      )}

      {!embedded && !isCompact && (
        <header className="space-y-5">
          <div className="space-y-3">
            <p className="text-eyebrow text-brand-700 dark:text-brand-300">{t('calculator.eyebrow')}</p>
            <h1 className="text-display text-fg">{t('calculator.title')}</h1>
            <p className="max-w-2xl text-body text-fg-muted">{t('calculator.intro')}</p>
          </div>
          <div className="card p-4 sm:p-5">
            <PropertyKindTabs
              kind={kind}
              onSelect={(next) =>
                selectKind(next, {
                  setKind,
                  setProjectId,
                  setShopZoneId,
                  setShopFloor,
                  setBedrooms,
                  setFloor,
                  setAreaSqm,
                })
              }
            />
          </div>
        </header>
      )}

      {embedded && preset && presetProject && (
        <div className="surface border-brand-200/50 p-6 sm:p-8 dark:border-brand-800/50">
          <p className="section-eyebrow">{t('calculator.embeddedEyebrow')}</p>
          <h2 className="mt-1 text-h2">
            {listingTitle ?? t('calculator.embeddedTitle')}
          </h2>
          <p className="mt-2 text-sm text-fg-muted">{t('calculator.embeddedIntro')}</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-fg-muted">{t('calculator.embeddedProject')}</dt>
              <dd className="font-medium text-fg">{t(presetProject.nameKey)}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">{t('calculator.embeddedBedrooms')}</dt>
              <dd className="font-medium text-fg">{formatBedroomCount(preset.bedrooms, t)}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">{t('calculator.finishLabel')}</dt>
              <dd className="font-medium text-fg">{t('calculator.finishSemi')}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">{t('calculator.embeddedSize')}</dt>
              <dd className="font-medium text-fg">
                {areaSqm != null ? formatSquareMeters(areaSqm, t) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-fg-muted">{t('calculator.embeddedFloor')}</dt>
              <dd className="font-medium text-fg">{t('calculator.floorN', { n: floor ?? preset.floor })}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
            <Link
              to="/calculator"
              className="text-brand-700 underline dark:text-brand-300"
            >
              {t('calculator.openFullCalculator')}
            </Link>
            <Link
              to="/calculator?kind=shop"
              className="text-brand-700 underline dark:text-brand-300"
            >
              {t('calculator.openShopCalculator')}
            </Link>
          </div>
        </div>
      )}

      {configError ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
          {t('calculator.pricingLoadFailed')}
        </p>
      ) : !configLoading ? (
        <p className="text-xs text-fg-muted">{t('calculator.liveRatesNote')}</p>
      ) : null}

      {!isCompact && (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          {t('calculator.disclaimer')}
        </p>
      )}

      {embedded ? (
        <div className="space-y-6">
          {wizardColumn}
          <CalculatorResults
            result={result}
            kind={kind}
            canShowResult={Boolean(canShowResult)}
            step5Done={step5Done}
            compact={isCompact}
          />
        </div>
      ) : isCompact ? (
        <div className="flex w-full flex-col gap-6">
          {wizardColumn}
          <CalculatorResults
            result={result}
            kind={kind}
            canShowResult={Boolean(canShowResult)}
            step5Done={step5Done}
            compact
          />
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr,min(22rem,100%)]">
          {wizardColumn}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CalculatorResults
              result={result}
              kind={kind}
              canShowResult={Boolean(canShowResult)}
              step5Done={step5Done}
            />
          </aside>
        </div>
      )}

      {!embedded && !isCompact && (
        <section className="card space-y-4 p-6 text-sm text-fg-muted">
          <h2 className="text-base font-bold text-fg">{t('calculator.howItWorksTitle')}</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>{t('calculator.how1')}</li>
            <li>{t('calculator.how2')}</li>
            <li>{t('calculator.how3')}</li>
            <li>{t('calculator.how4')}</li>
          </ol>
        </section>
      )}
    </div>
  )
}
