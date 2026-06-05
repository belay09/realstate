import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { api } from '../../api/client'
import type { AdminLocationContent, Paginated } from '../../api/types'

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

function emptyZone(id: string): CommercialZoneStored {
  return {
    id,
    label_key: `calculator.shopZones.${id}`,
    floors: { GF: 0, '1F': 0, '2F': 0, '3F': 0 },
  }
}

function zonesForActiveShops(
  stored: CommercialZoneStored[],
  activeShops: AdminLocationContent[],
): CommercialZoneStored[] {
  const byId = new Map(stored.map((z) => [z.id, z]))
  return activeShops.map((shop) => byId.get(shop.location_id) ?? emptyZone(shop.location_id))
}

export function CalculatorConfigEditor({ companyId, initialConfig }: Props) {
  const qc = useQueryClient()
  const [zones, setZones] = useState<CommercialZoneStored[]>([])
  const [tiers, setTiers] = useState<DownPaymentTierStored[]>([])
  const [dirty, setDirty] = useState(false)
  const [copyFromZoneId, setCopyFromZoneId] = useState('')
  const [copyToZoneIds, setCopyToZoneIds] = useState<string[]>([])

  const shopLocations = useQuery({
    queryKey: ['admin', 'location-content', 'shop', 'calculator-editor'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AdminLocationContent>>('/admin/location-content', {
        params: { kind: 'shop', limit: 200 },
      })
      return data
    },
  })

  const activeShops = useMemo(
    () => (shopLocations.data?.items ?? []).filter((row) => row.is_public),
    [shopLocations.data?.items],
  )

  useEffect(() => {
    setTiers(initialConfig?.down_payment_tiers ?? [])
    setDirty(false)
  }, [initialConfig])

  useEffect(() => {
    if (shopLocations.isLoading) return
    const stored = initialConfig?.commercial_zones ?? []
    setZones(zonesForActiveShops(stored, activeShops))
    setDirty(false)
  }, [initialConfig, activeShops, shopLocations.isLoading])

  const saveErrorMessage = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.detail?.message
      if (typeof message === 'string' && message.trim()) return message
    }
    if (err instanceof Error && err.message.trim()) return err.message
    return 'Could not save calculator settings.'
  }

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
      toast.success('Calculator settings updated.')
    },
    onError: (err) => toast.error(saveErrorMessage(err)),
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
          client discount by down-payment tier. Only <strong>Active</strong> shop locations from
          Location pages appear below; saving removes rates for hidden or deleted shops.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Shop zones (ETB per m² by floor)
        </h3>
        {shopLocations.isLoading ? (
          <p className="text-sm text-stone-500">Loading shop locations…</p>
        ) : activeShops.length === 0 ? (
          <p className="text-sm text-stone-500">
            No Active shop locations. Create one under Location pages and mark it Active.
          </p>
        ) : (
          <>
            {zones.length > 1 ? (
              <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/80 p-3 dark:border-stone-700 dark:bg-stone-900/40">
                <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  Copy floor rates between shops
                </p>
                <p className="mt-1 text-[11px] text-stone-500">
                  Reuse the same GF–3F ETB/m² values without retyping each shop.
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="text-xs text-stone-600 dark:text-stone-400">
                    From
                    <select
                      className="input mt-1 min-w-[10rem]"
                      value={copyFromZoneId}
                      onChange={(e) => {
                        setCopyFromZoneId(e.target.value)
                        setCopyToZoneIds([])
                      }}
                    >
                      <option value="">Select shop…</option>
                      {zones.map((z) => {
                        const shop = activeShops.find((s) => s.location_id === z.id)
                        return (
                          <option key={z.id} value={z.id}>
                            {shop?.title ?? z.id}
                          </option>
                        )
                      })}
                    </select>
                  </label>
                  {copyFromZoneId ? (
                    <>
                      <div className="min-w-[12rem] flex-1">
                        <p className="text-xs text-stone-600 dark:text-stone-400">To</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {zones
                            .filter((z) => z.id !== copyFromZoneId)
                            .map((z) => {
                              const shop = activeShops.find((s) => s.location_id === z.id)
                              const checked = copyToZoneIds.includes(z.id)
                              return (
                                <label
                                  key={z.id}
                                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs dark:border-stone-700 dark:bg-stone-950"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      setCopyToZoneIds((prev) =>
                                        checked ? prev.filter((id) => id !== z.id) : [...prev, z.id],
                                      )
                                    }
                                  />
                                  {shop?.title ?? z.id}
                                </label>
                              )
                            })}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        disabled={copyToZoneIds.length === 0}
                        onClick={() => {
                          const source = zones.find((z) => z.id === copyFromZoneId)
                          if (!source) return
                          setZones((prev) =>
                            prev.map((z) =>
                              copyToZoneIds.includes(z.id)
                                ? { ...z, floors: { ...source.floors } }
                                : z,
                            ),
                          )
                          setDirty(true)
                          toast.success(
                            `Copied floor rates to ${copyToZoneIds.length} shop${copyToZoneIds.length === 1 ? '' : 's'}. Save to publish.`,
                          )
                          setCopyToZoneIds([])
                        }}
                      >
                        Apply copy
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-700">
                  <th className="py-2 pr-2 font-medium">Zone</th>
                  <th className="py-2 pr-2 font-medium">Title</th>
                  <th className="py-2 pr-2 font-medium">GF</th>
                  <th className="py-2 pr-2 font-medium">1F</th>
                  <th className="py-2 pr-2 font-medium">2F</th>
                  <th className="py-2 font-medium">3F</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone, idx) => {
                  const shop = activeShops.find((s) => s.location_id === zone.id)
                  return (
                    <tr key={zone.id} className="border-b border-stone-100 dark:border-stone-800">
                      <td className="py-2 pr-2 font-mono text-xs">{zone.id}</td>
                      <td className="py-2 pr-2 text-xs text-stone-600 dark:text-stone-400">
                        {shop?.title ?? '—'}
                      </td>
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
                  )
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
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
        disabled={!dirty || save.isPending || activeShops.length === 0}
        onClick={() => save.mutate()}
      >
        {save.isPending ? 'Saving…' : 'Save calculator settings'}
      </button>
    </section>
  )
}
