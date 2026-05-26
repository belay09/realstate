import { useMemo, useState } from 'react'

import {
  BEDROOM_AREA_OPTIONS,
  COMMERCIAL_AREA_MAX,
  COMMERCIAL_AREA_MIN,
  COMMERCIAL_AREA_PRESETS,
  COMMERCIAL_ZONES,
  DOWN_PAYMENT_TIERS,
  RESIDENTIAL_PROJECTS,
  type CompletionKind,
  type FinishKind,
  type PropertyKind,
} from '../data/ayatCalculatorConfig'
import { useTranslation } from '../context/LocaleContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { calculateCommercial, calculateResidential } from '../lib/ayatCalculator'
import { formatMoney } from '../lib/format'

type ShopFloor = 'GF' | '1F' | '2F' | '3F'

const SHOP_FLOORS: ShopFloor[] = ['GF', '1F', '2F', '3F']

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
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
        selected
          ? 'border-brand-500 bg-brand-50 font-semibold text-brand-900 ring-2 ring-brand-500/30 dark:bg-brand-950 dark:text-brand-100'
          : 'border-border bg-surface hover:border-brand-300'
      }`}
    >
      {children}
    </button>
  )
}

export function AyatCalculatorPage() {
  const { t } = useTranslation()
  usePageTitle(t('pageTitles.calculator'))

  const [kind, setKind] = useState<PropertyKind | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [completion, setCompletion] = useState<CompletionKind>('unstarted')
  const [bedrooms, setBedrooms] = useState<1 | 2 | 3 | null>(null)
  const [finish, setFinish] = useState<FinishKind | null>(null)
  const [areaSqm, setAreaSqm] = useState<number | null>(null)
  const [floor, setFloor] = useState<number | null>(null)
  const [shopZoneId, setShopZoneId] = useState<string | null>(null)
  const [shopFloor, setShopFloor] = useState<ShopFloor | null>(null)
  const [tierId, setTierId] = useState<string>('100')

  const project = RESIDENTIAL_PROJECTS.find((p) => p.id === projectId)

  const result = useMemo(() => {
    if (kind === 'residential') {
      if (
        !projectId ||
        bedrooms == null ||
        !finish ||
        areaSqm == null ||
        floor == null
      ) {
        return null
      }
      return calculateResidential({
        projectId,
        bedrooms,
        finish,
        areaSqm,
        floor,
        completion,
        tierId,
      })
    }
    if (kind === 'commercial') {
      if (!shopZoneId || !shopFloor || areaSqm == null) return null
      return calculateCommercial({
        zoneId: shopZoneId,
        shopFloor,
        areaSqm,
        tierId,
      })
    }
    return null
  }, [
    kind,
    projectId,
    bedrooms,
    finish,
    areaSqm,
    floor,
    completion,
    tierId,
    shopZoneId,
    shopFloor,
  ])

  const step1Done = kind != null
  const step2Done =
    kind === 'residential'
      ? projectId != null
      : kind === 'commercial'
        ? shopZoneId != null
        : false
  const step3Done =
    kind === 'residential'
      ? bedrooms != null && finish != null
      : kind === 'commercial'
        ? shopFloor != null
        : false
  const step4Done = areaSqm != null
  const step5Done =
    kind === 'residential' ? floor != null : kind === 'commercial' ? true : false

  const canShowResult = step1Done && step2Done && step3Done && step4Done && step5Done && result

  const areaOptions =
    bedrooms != null ? BEDROOM_AREA_OPTIONS[bedrooms] : COMMERCIAL_AREA_PRESETS

  return (
    <div className="mx-auto max-w-5xl space-y-10 text-left">
      <header className="space-y-3">
        <p className="text-eyebrow text-brand-700 dark:text-brand-300">{t('calculator.eyebrow')}</p>
        <h1 className="text-display text-fg">{t('calculator.title')}</h1>
        <p className="max-w-2xl text-body text-fg-muted">{t('calculator.intro')}</p>
        <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          {t('calculator.disclaimer')}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr,min(22rem,100%)]">
        <div className="space-y-8">
          {/* Step 1 */}
          <section className="card p-6">
            <div className="mb-4 flex items-center gap-3">
              <StepBadge n={1} active={!step1Done} done={step1Done} />
              <h2 className="text-lg font-bold text-fg">{t('calculator.step1Title')}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceButton
                selected={kind === 'residential'}
                onClick={() => {
                  setKind('residential')
                  setShopZoneId(null)
                  setShopFloor(null)
                }}
              >
                <span className="block font-semibold">{t('calculator.kindHome')}</span>
                <span className="mt-1 block text-xs font-normal text-fg-muted">
                  {t('calculator.kindHomeHint')}
                </span>
              </ChoiceButton>
              <ChoiceButton
                selected={kind === 'commercial'}
                onClick={() => {
                  setKind('commercial')
                  setProjectId(null)
                  setBedrooms(null)
                  setFinish(null)
                  setFloor(null)
                  setAreaSqm(null)
                }}
              >
                <span className="block font-semibold">{t('calculator.kindShop')}</span>
                <span className="mt-1 block text-xs font-normal text-fg-muted">
                  {t('calculator.kindShopHint')}
                </span>
              </ChoiceButton>
            </div>
          </section>

          {kind === 'residential' && (
            <section className="card p-6">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={2} active={step1Done && !step2Done} done={step2Done} />
                <h2 className="text-lg font-bold text-fg">{t('calculator.step2AreaTitle')}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {RESIDENTIAL_PROJECTS.map((p) => (
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
              {project?.supportsCompletionChoice && (
                <div className="mt-5 space-y-2">
                  <p className="text-sm font-medium text-fg">{t('calculator.completionLabel')}</p>
                  <div className="flex flex-wrap gap-2">
                    <ChoiceButton
                      selected={completion === 'unstarted'}
                      onClick={() => setCompletion('unstarted')}
                    >
                      {t('calculator.completionUnstarted')}
                    </ChoiceButton>
                    <ChoiceButton
                      selected={completion === 'near_completion'}
                      onClick={() => setCompletion('near_completion')}
                    >
                      {t('calculator.completionNear')}
                    </ChoiceButton>
                  </div>
                  <p className="text-xs text-fg-muted">{t('calculator.completionHint')}</p>
                </div>
              )}
            </section>
          )}

          {kind === 'commercial' && (
            <section className="card p-6">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={2} active={step1Done && !step2Done} done={step2Done} />
                <h2 className="text-lg font-bold text-fg">{t('calculator.step2ShopZoneTitle')}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {COMMERCIAL_ZONES.map((z) => (
                  <ChoiceButton
                    key={z.id}
                    selected={shopZoneId === z.id}
                    onClick={() => setShopZoneId(z.id)}
                  >
                    {t(z.labelKey)}
                  </ChoiceButton>
                ))}
              </div>
            </section>
          )}

          {kind === 'residential' && projectId && (
            <section className="card p-6">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={3} active={step2Done && !step3Done} done={step3Done} />
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
                    {t('calculator.bedrooms', { count: b })}
                  </ChoiceButton>
                ))}
              </div>
              {bedrooms != null && (
                <>
                  <p className="mb-2 text-sm font-medium text-fg">{t('calculator.finishLabel')}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ChoiceButton
                      selected={finish === 'semi-finished'}
                      onClick={() => setFinish('semi-finished')}
                    >
                      <span className="font-semibold">{t('calculator.finishSemi')}</span>
                      <span className="mt-1 block text-xs font-normal text-fg-muted">
                        {t('calculator.finishSemiHint')}
                      </span>
                    </ChoiceButton>
                    <ChoiceButton
                      selected={finish === 'regular-finished'}
                      onClick={() => setFinish('regular-finished')}
                    >
                      <span className="font-semibold">{t('calculator.finishRegular')}</span>
                      <span className="mt-1 block text-xs font-normal text-fg-muted">
                        {t('calculator.finishRegularHint')}
                      </span>
                    </ChoiceButton>
                  </div>
                </>
              )}
            </section>
          )}

          {kind === 'commercial' && shopZoneId && (
            <section className="card p-6">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={3} active={step2Done && !step3Done} done={step3Done} />
                <h2 className="text-lg font-bold text-fg">{t('calculator.step3ShopFloorTitle')}</h2>
              </div>
              <p className="mb-3 text-sm text-fg-muted">{t('calculator.step3ShopFloorHint')}</p>
              <div className="flex flex-wrap gap-2">
                {SHOP_FLOORS.map((f) => (
                  <ChoiceButton
                    key={f}
                    selected={shopFloor === f}
                    onClick={() => setShopFloor(f)}
                  >
                    {t(`calculator.shopFloor.${f}`)}
                  </ChoiceButton>
                ))}
              </div>
            </section>
          )}

          {kind &&
            ((kind === 'residential' && bedrooms != null && finish != null) ||
              (kind === 'commercial' && shopFloor != null)) && (
              <section className="card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <StepBadge n={4} active={step3Done && !step4Done} done={step4Done} />
                  <h2 className="text-lg font-bold text-fg">{t('calculator.step4SizeTitle')}</h2>
                </div>
                <p className="mb-3 text-sm text-fg-muted">{t('calculator.step4SizeHint')}</p>
                <div className="flex flex-wrap gap-2">
                  {areaOptions.map((a) => (
                    <ChoiceButton
                      key={a}
                      selected={areaSqm === a}
                      onClick={() => setAreaSqm(a)}
                    >
                      {a} m²
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
                      min={COMMERCIAL_AREA_MIN}
                      max={COMMERCIAL_AREA_MAX}
                      value={areaSqm ?? ''}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        if (!Number.isNaN(v)) setAreaSqm(v)
                      }}
                      className="mt-2 w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    />
                    <p className="mt-1 text-xs text-fg-muted">
                      {t('calculator.shopSizeRange', {
                        min: COMMERCIAL_AREA_MIN,
                        max: COMMERCIAL_AREA_MAX,
                      })}
                    </p>
                  </div>
                )}
              </section>
            )}

          {kind === 'residential' && areaSqm != null && project && (
            <section className="card p-6">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={5} active={step4Done && !step5Done} done={step5Done} />
                <h2 className="text-lg font-bold text-fg">{t('calculator.step5FloorTitle')}</h2>
              </div>
              <p className="mb-3 text-sm text-fg-muted">{t('calculator.step5FloorHint')}</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: project.maxFloor }, (_, i) => i + 1).map((f) => (
                  <ChoiceButton key={f} selected={floor === f} onClick={() => setFloor(f)}>
                    {t('calculator.floorN', { n: f })}
                  </ChoiceButton>
                ))}
              </div>
            </section>
          )}

          {step5Done && (
            <section className="card p-6">
              <h2 className="mb-3 text-lg font-bold text-fg">{t('calculator.step6PaymentTitle')}</h2>
              <p className="mb-4 text-sm text-fg-muted">{t('calculator.step6PaymentHint')}</p>
              <div className="space-y-2">
                {DOWN_PAYMENT_TIERS.map((tier) => (
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
                      name="tier"
                      className="mt-1"
                      checked={tierId === tier.id}
                      onChange={() => setTierId(tier.id)}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-fg">
                        {t(tier.labelKey)}
                      </span>
                      <span className="block text-xs text-fg-muted">
                        {t('calculator.tierDiscount', {
                          percent: tier.clientDiscountPercent,
                        })}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card border-brand-200/60 bg-gradient-to-b from-brand-50/80 to-surface p-6 dark:border-brand-800/40 dark:from-brand-950/50">
            <h2 className="text-lg font-bold text-fg">{t('calculator.resultTitle')}</h2>
            {!canShowResult && (
              <p className="mt-4 text-sm text-fg-muted">{t('calculator.resultPending')}</p>
            )}
            {canShowResult && result && (
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-fg-muted">{t('calculator.pricePerSqm')}</dt>
                  <dd className="text-xl font-bold text-fg">
                    {formatMoney(result.pricePerSqm, result.currency)}
                    <span className="text-sm font-normal text-fg-muted"> / m²</span>
                  </dd>
                  {result.floorBandLabel && (
                    <p className="mt-1 text-xs text-fg-muted">
                      {kind === 'residential'
                        ? t('calculator.floorBand', { band: result.floorBandLabel })
                        : t('calculator.shopFloorSelected', { floor: result.floorBandLabel })}
                    </p>
                  )}
                  {result.unitTypeCode && (
                    <p className="text-xs text-fg-muted">
                      {t('calculator.unitType', { code: result.unitTypeCode })}
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
                </div>

                <div>
                  <dt className="text-fg-muted">{t('calculator.priceAfterDiscount')}</dt>
                  <dd className="text-2xl font-bold text-brand-800 dark:text-brand-200">
                    {formatMoney(result.priceAfterDiscount, result.currency)}
                  </dd>
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
                        <li
                          key={m.id}
                          className="flex justify-between gap-2 text-xs sm:text-sm"
                        >
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
        </aside>
      </div>

      <section className="card space-y-4 p-6 text-sm text-fg-muted">
        <h2 className="text-base font-bold text-fg">{t('calculator.howItWorksTitle')}</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>{t('calculator.how1')}</li>
          <li>{t('calculator.how2')}</li>
          <li>{t('calculator.how3')}</li>
          <li>{t('calculator.how4')}</li>
        </ol>
      </section>
    </div>
  )
}
