import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { api } from '../../api/client'

type CommercialZoneStored = {
  id: string
  label_key: string
  floors: { GF: number; '1F': number; '2F': number; '3F': number }
}

type DownPaymentTierStored = {
  id: string
  down_payment_percent: number
  client_discount_percent: number
  label_key: string
  is_6040?: boolean
}

type CalculatorConfigStored = {
  commercial_zones?: CommercialZoneStored[]
  down_payment_tiers?: DownPaymentTierStored[]
}

type Props = {
  companyId: string
  initialConfig: CalculatorConfigStored | null
}

export function CalculatorConfigEditor({ companyId, initialConfig }: Props) {
  const qc = useQueryClient()
  const [zones, setZones] = useState<CommercialZoneStored[]>([])
  const [tiers, setTiers] = useState<DownPaymentTierStored[]>([])
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setZones(initialConfig?.commercial_zones ?? [])
    setTiers(initialConfig?.down_payment_tiers ?? [])
    setDirty(false)
  }, [initialConfig])

  const save = useMutation({
    mutationFn: () =>
      api.patch(
        '/admin/pricing/live/calculator-config',
        { commercial_zones: zones, down_payment_tiers: tiers },
        { params: { company_id: companyId } },
      ),
    onSuccess: () => {
      setDirty(false)
      qc.invalidateQueries({ queryKey: ['admin', 'pricing-live', companyId] })
      qc.invalidateQueries({ queryKey: ['public', 'calculator-config'] })
    },
  })

  if (!companyId) return null

  return (
    <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
      <div>
        <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
          Calculator — shops & payment plans
        </h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Apartment rates are set in the price rows above. Here you set shop ETB/m² by floor and
          client discount by down-payment tier. Changes apply on the live site as soon as you save.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Shop zones (ETB per m² by floor)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700">
                <th className="py-2 pr-2 font-medium">Zone</th>
                <th className="py-2 pr-2 font-medium">GF</th>
                <th className="py-2 pr-2 font-medium">1F</th>
                <th className="py-2 pr-2 font-medium">2F</th>
                <th className="py-2 font-medium">3F</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone, idx) => (
                <tr key={zone.id} className="border-b border-stone-100 dark:border-stone-800">
                  <td className="py-2 pr-2 font-mono text-xs">{zone.id}</td>
                  {(['GF', '1F', '2F', '3F'] as const).map((floor) => (
                    <td key={floor} className="py-2 pr-2">
                      <input
                        type="number"
                        className="input w-24"
                        value={zone.floors[floor]}
                        onChange={(e) => {
                          const next = [...zones]
                          next[idx] = {
                            ...zone,
                            floors: { ...zone.floors, [floor]: Number(e.target.value) || 0 },
                          }
                          setZones(next)
                          setDirty(true)
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Down payment tiers (client discount %)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700">
                <th className="py-2 pr-2 font-medium">Tier</th>
                <th className="py-2 pr-2 font-medium">Down %</th>
                <th className="py-2 font-medium">Discount %</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, idx) => (
                <tr key={tier.id} className="border-b border-stone-100 dark:border-stone-800">
                  <td className="py-2 pr-2 font-mono text-xs">{tier.id}</td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      className="input w-20"
                      disabled={tier.is_6040}
                      value={tier.down_payment_percent}
                      onChange={(e) => {
                        const next = [...tiers]
                        next[idx] = {
                          ...tier,
                          down_payment_percent: Number(e.target.value) || 0,
                        }
                        setTiers(next)
                        setDirty(true)
                      }}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      className="input w-20"
                      value={tier.client_discount_percent}
                      onChange={(e) => {
                        const next = [...tiers]
                        next[idx] = {
                          ...tier,
                          client_discount_percent: Number(e.target.value) || 0,
                        }
                        setTiers(next)
                        setDirty(true)
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={!dirty || save.isPending}
        onClick={() => save.mutate()}
      >
        {save.isPending ? 'Saving…' : 'Save calculator settings'}
      </button>
      {save.isError ? (
        <p className="text-sm text-red-600">Could not save calculator settings.</p>
      ) : null}
    </section>
  )
}
