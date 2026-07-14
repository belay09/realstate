import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { api } from '../../api/client'
import type {
  AdminLocationContent,
  AdminUnitListingOption,
  ListingMetadata,
  Paginated,
  Project,
  UnitType,
} from '../../api/types'

type LocationKind = 'apartment' | 'shop'

type Props = {
  companyId: string
  onClose: () => void
  onCreated: (listingId: string) => void
}

function actionError(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.detail?.message
    if (typeof message === 'string' && message.trim()) return message
  }
  if (err instanceof Error && err.message.trim()) return err.message
  return fallback
}

export function AdminCreateListingModal({ companyId, onClose, onCreated }: Props) {
  const qc = useQueryClient()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('Addis Ababa')
  const [area, setArea] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [locationKind, setLocationKind] = useState<LocationKind>('apartment')
  const [locationId, setLocationId] = useState('')
  const [floorNumber, setFloorNumber] = useState('')
  const [buildingType, setBuildingType] = useState<'' | 'mixed' | 'duplex' | 'flat'>('')
  const [useSegment, setUseSegment] = useState<'' | 'retail' | 'residential'>('')
  const [linkUnitId, setLinkUnitId] = useState('')
  const [unitTypeId, setUnitTypeId] = useState('')
  const [unitNumber, setUnitNumber] = useState('')

  const locationPages = useQuery({
    queryKey: ['admin', 'location-content', 'all'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AdminLocationContent>>('/admin/location-content', {
        params: { limit: 200 },
      })
      return data
    },
  })

  const unitOptions = useQuery({
    queryKey: ['admin', 'listing-unit-options', companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<AdminUnitListingOption>>(
        '/admin/listings/unit-options',
        { params: { company_id: companyId, without_listing: true, limit: 200 } },
      )
      return data
    },
  })

  const unitTypes = useQuery({
    queryKey: ['admin', 'unit-types', companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<UnitType>>('/admin/unit-types', {
        params: { company_id: companyId, limit: 100 },
      })
      return data
    },
  })

  const activeLocations = useMemo(
    () => (locationPages.data?.items ?? []).filter((row) => row.is_public),
    [locationPages.data?.items],
  )

  const locationOptions = useMemo(
    () => activeLocations.filter((row) => row.kind === locationKind),
    [activeLocations, locationKind],
  )

  const selectedLocation = activeLocations.find((row) => row.location_id === locationId)

  useEffect(() => {
    const opts = locationOptions
    if (!opts.length) {
      setLocationId('')
      return
    }
    if (!opts.some((row) => row.location_id === locationId)) {
      setLocationId(opts[0].location_id)
    }
  }, [locationKind, locationOptions, locationId])

  useEffect(() => {
    if (!selectedLocation) return
    if (!area.trim()) setArea(selectedLocation.subtitle ?? selectedLocation.title ?? '')
  }, [selectedLocation?.id, area])

  useEffect(() => {
    const items = unitTypes.data?.items ?? []
    if (items.length === 0) return
    if (!items.some((t) => t.id === unitTypeId)) setUnitTypeId(items[0].id)
  }, [unitTypes.data, unitTypeId])

  const importUnits = unitOptions.data?.items ?? []

  async function resolveUnitId(): Promise<string> {
    if (linkUnitId) return linkUnitId

    if (!unitTypeId) {
      throw new Error('No unit types for this company. Run Ayat/Temer seed data first.')
    }
    if (!locationId.trim()) {
      throw new Error('Pick an active location')
    }

    const loc = selectedLocation
    const { data: projects } = await api.get<Paginated<Project>>('/admin/projects', {
      params: { company_id: companyId, limit: 100 },
    })
    const slug = locationId.trim()
    let project = projects.items.find((p) => p.slug === slug)
    if (!project) {
      const { data: created } = await api.post<Project>('/admin/projects', {
        company_id: companyId,
        name: loc?.title ?? slug,
        slug,
        city: city.trim() || 'Addis Ababa',
        area: area.trim() || null,
        status: 'active',
      })
      project = created
    }

    const { data: blocks } = await api.get<Paginated<{ id: string }>>('/admin/blocks', {
      params: { project_id: project.id, limit: 50 },
    })
    let blockId = blocks.items[0]?.id
    if (!blockId) {
      const { data: block } = await api.post<{ id: string }>('/admin/blocks', {
        project_id: project.id,
        name: 'Default',
        code: 'DEF',
        total_floors: 20,
      })
      blockId = block.id
    }

    const floor = floorNumber.trim() ? Number(floorNumber) : null
    const number =
      unitNumber.trim() ||
      (Number.isFinite(floor) ? String(floor) : `home-${Date.now().toString(36).slice(-6)}`)

    const { data: unit } = await api.post<{ id: string }>('/admin/units', {
      block_id: blockId,
      unit_type_id: unitTypeId,
      unit_number: number,
      floor_number: Number.isFinite(floor) ? floor : null,
      status: 'available',
    })
    return unit.id
  }

  const createListing = useMutation({
    mutationFn: async () => {
      const resolvedUnitId = await resolveUnitId()

      const listing_metadata: ListingMetadata | null =
        locationKind === 'apartment' && buildingType
          ? {
              property_kind: 'residential',
              external_property_id: null,
              building_type: buildingType,
              use_segment: buildingType === 'mixed' ? useSegment || null : null,
              tower_code: null,
              specs: {},
              features: { interior: [], outdoor: [], utilities: [], other: [] },
              map: null,
            }
          : null

      const { data: listing } = await api.post<{ id: string }>('/admin/listings', {
        unit_id: resolvedUnitId,
        title: title.trim(),
        description: description.trim() || null,
        city: city.trim() || null,
        area: area.trim() || null,
        is_public: isPublic,
        listing_metadata,
        location_kind: locationKind,
        location_id: locationId.trim(),
      })
      return listing.id
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ['admin', 'property-listings'] })
      qc.invalidateQueries({ queryKey: ['admin', 'listing-unit-options'] })
      toast.success('Listing created - add photos next')
      onCreated(id)
    },
    onError: (err) => toast.error(actionError(err, 'Could not create listing')),
  })

  const missingUnitTypes = unitTypes.isFetched && (unitTypes.data?.items.length ?? 0) === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-stone-200 bg-white p-5 shadow-xl dark:border-stone-800 dark:bg-stone-950"
        role="dialog"
        aria-labelledby="create-listing-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="create-listing-title" className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Add listing
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Same fields as edit - we create the inventory link automatically. Add photos after save.
            </p>
          </div>
          <button type="button" className="text-sm text-stone-500 hover:underline" onClick={onClose}>
            Close
          </button>
        </div>

        {missingUnitTypes ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            This company has no unit types yet. Run{' '}
            <code className="text-[11px]">seed_ayat_production</code> or{' '}
            <code className="text-[11px]">seed_demo_data</code> first.
          </p>
        ) : null}

        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            createListing.mutate()
          }}
        >
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-800 dark:bg-stone-900/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Location on site
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Type
                <select
                  className="input mt-1 w-full"
                  value={locationKind}
                  onChange={(e) => setLocationKind(e.target.value as LocationKind)}
                >
                  <option value="apartment">Apartment location</option>
                  <option value="shop">Shop location</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Active location
                <select
                  className="input mt-1 w-full"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  disabled={locationOptions.length === 0}
                  required
                >
                  {locationOptions.length === 0 ? (
                    <option value="">No active locations</option>
                  ) : (
                    locationOptions.map((row) => (
                      <option key={row.id} value={row.location_id}>
                        {row.title} ({row.location_id})
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>
            <p className="mt-2 text-xs text-stone-500">
              Only locations marked <strong>Active</strong> under Locations appear here.
            </p>
          </div>

          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Title
            <input
              className="input mt-1 w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Three-bedroom semi-finished - floor 11"
              required
            />
          </label>

          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Description
            <textarea
              className="input mt-1 min-h-28 w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              City
              <input className="input mt-1 w-full" value={city} onChange={(e) => setCity(e.target.value)} />
              <span className="mt-1 block font-normal text-stone-500">Display label only.</span>
            </label>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              Area
              <input className="input mt-1 w-full" value={area} onChange={(e) => setArea(e.target.value)} />
              <span className="mt-1 block font-normal text-stone-500">Display label only.</span>
            </label>
          </div>

          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Floor (optional)
            <input
              className="input mt-1 w-full max-w-[8rem]"
              type="number"
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
              placeholder="11"
            />
            <span className="mt-1 block font-normal text-stone-500">
              Shown on the public page and used internally - not the same as the listing title.
            </span>
          </label>

          {locationKind === 'apartment' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Building type (optional)
                <select
                  className="input mt-1 w-full"
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value as typeof buildingType)}
                >
                  <option value="">- not set -</option>
                  <option value="mixed">Mixed use</option>
                  <option value="duplex">Duplex</option>
                  <option value="flat">Flat</option>
                </select>
              </label>
              {buildingType === 'mixed' ? (
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                  Use segment
                  <select
                    className="input mt-1 w-full"
                    value={useSegment}
                    onChange={(e) => setUseSegment(e.target.value as typeof useSegment)}
                  >
                    <option value="">- select -</option>
                    <option value="retail">Retail / shop floor</option>
                    <option value="residential">Residential floor</option>
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            Show on public site
          </label>

          <details
            className="rounded-lg border border-stone-200 dark:border-stone-800"
            open={showAdvanced}
            onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Advanced - import / inventory (optional)
            </summary>
            <div className="space-y-3 border-t border-stone-200 px-4 py-3 dark:border-stone-800">
              <p className="text-xs text-stone-500">
                Only use this if seed data already created units (e.g. Ayat Hills #105) and you want to
                attach a listing to that unit instead of auto-creating one.
              </p>
              {importUnits.length > 0 ? (
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                  Link to imported unit
                  <select
                    className="input mt-1 w-full"
                    value={linkUnitId}
                    onChange={(e) => setLinkUnitId(e.target.value)}
                  >
                    <option value="">Auto-create unit (recommended)</option>
                    {importUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.project_name} / {u.block_name} - #{u.unit_number} ({u.unit_type_name})
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="text-xs text-stone-500">No imported units waiting for a listing.</p>
              )}
              {!linkUnitId ? (
                <>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                    Layout / unit type (for pricing)
                    <select
                      className="input mt-1 w-full"
                      value={unitTypeId}
                      onChange={(e) => setUnitTypeId(e.target.value)}
                    >
                      {(unitTypes.data?.items ?? []).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                    Internal unit number (optional)
                    <input
                      className="input mt-1 w-full max-w-xs font-mono text-sm"
                      value={unitNumber}
                      onChange={(e) => setUnitNumber(e.target.value)}
                      placeholder="Leave blank - uses floor or auto ID"
                    />
                  </label>
                </>
              ) : null}
            </div>
          </details>

          <div className="flex justify-end gap-2 border-t border-stone-200 pt-4 dark:border-stone-800">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={
                createListing.isPending ||
                !title.trim() ||
                !locationId.trim() ||
                missingUnitTypes
              }
            >
              {createListing.isPending ? 'Creating…' : 'Create listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
