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
  const [mode, setMode] = useState<'existing' | 'new'>('new')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('Addis Ababa')
  const [area, setArea] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [locationKind, setLocationKind] = useState<LocationKind>('apartment')
  const [locationId, setLocationId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [unitTypeId, setUnitTypeId] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [floorNumber, setFloorNumber] = useState('')
  const [buildingType, setBuildingType] = useState<'' | 'mixed' | 'duplex' | 'flat'>('')
  const [useSegment, setUseSegment] = useState<'' | 'retail' | 'residential'>('')

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
    enabled: Boolean(companyId) && mode === 'existing',
    queryFn: async () => {
      const { data } = await api.get<Paginated<AdminUnitListingOption>>(
        '/admin/listings/unit-options',
        { params: { company_id: companyId, without_listing: true, limit: 200 } },
      )
      return data
    },
  })

  const projects = useQuery({
    queryKey: ['admin', 'projects', companyId],
    enabled: Boolean(companyId) && mode === 'new',
    queryFn: async () => {
      const { data } = await api.get<Paginated<Project>>('/admin/projects', {
        params: { company_id: companyId, limit: 100 },
      })
      return data
    },
  })

  const unitTypes = useQuery({
    queryKey: ['admin', 'unit-types', companyId],
    enabled: Boolean(companyId) && mode === 'new',
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
    const items = unitOptions.data?.items ?? []
    if (mode !== 'existing' || items.length === 0) return
    if (!items.some((u) => u.id === unitId)) setUnitId(items[0].id)
  }, [mode, unitOptions.data, unitId])

  useEffect(() => {
    const items = projects.data?.items ?? []
    if (mode !== 'new' || items.length === 0) return
    if (!items.some((p) => p.id === projectId)) setProjectId(items[0].id)
  }, [mode, projects.data, projectId])

  useEffect(() => {
    const items = unitTypes.data?.items ?? []
    if (mode !== 'new' || items.length === 0) return
    if (!items.some((t) => t.id === unitTypeId)) setUnitTypeId(items[0].id)
  }, [mode, unitTypes.data, unitTypeId])

  const createListing = useMutation({
    mutationFn: async () => {
      let resolvedUnitId = unitId
      if (mode === 'new') {
        if (!unitTypeId || !unitNumber.trim()) {
          throw new Error('Unit type and unit number are required')
        }
        let resolvedProjectId = projectId
        if (!resolvedProjectId && locationId.trim()) {
          const loc = activeLocations.find((row) => row.location_id === locationId)
          const { data: project } = await api.post<Project>('/admin/projects', {
            company_id: companyId,
            name: loc?.title ?? locationId.trim(),
            slug: locationId.trim(),
            city: city.trim() || 'Addis Ababa',
            area: area.trim() || null,
            status: 'active',
          })
          resolvedProjectId = project.id
        }
        if (!resolvedProjectId) {
          throw new Error('Select a project or an active location to create one automatically')
        }
        const { data: blocks } = await api.get<Paginated<{ id: string; name: string }>>(
          '/admin/blocks',
          { params: { project_id: resolvedProjectId, limit: 50 } },
        )
        let blockId = blocks.items[0]?.id
        if (!blockId) {
          const { data: block } = await api.post<{ id: string }>('/admin/blocks', {
            project_id: resolvedProjectId,
            name: 'Default',
            code: 'DEF',
            total_floors: 20,
          })
          blockId = block.id
        }
        const floor = floorNumber.trim() ? Number(floorNumber) : null
        const { data: unit } = await api.post<{ id: string }>('/admin/units', {
          block_id: blockId,
          unit_type_id: unitTypeId,
          unit_number: unitNumber.trim(),
          floor_number: Number.isFinite(floor) ? floor : null,
          status: 'available',
        })
        resolvedUnitId = unit.id
      }

      if (!resolvedUnitId) throw new Error('Select a unit')

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
        location_kind: locationId.trim() ? locationKind : undefined,
        location_id: locationId.trim() || undefined,
      })
      return listing.id
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ['admin', 'property-listings'] })
      qc.invalidateQueries({ queryKey: ['admin', 'listing-unit-options'] })
      toast.success('Listing created')
      onCreated(id)
    },
    onError: (err) => toast.error(actionError(err, 'Could not create listing')),
  })

  const hasExistingUnits = (unitOptions.data?.items.length ?? 0) > 0
  const canCreateNew =
    (projects.data?.items.length ?? 0) > 0 && (unitTypes.data?.items.length ?? 0) > 0

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
              Add property listing
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Creates a public layout card. You can add photos after saving.
            </p>
          </div>
          <button type="button" className="text-sm text-stone-500 hover:underline" onClick={onClose}>
            Close
          </button>
        </div>

        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            createListing.mutate()
          }}
        >
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-stone-500">Unit</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="unit-mode"
                  checked={mode === 'new'}
                  onChange={() => setMode('new')}
                />
                Create new unit
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="unit-mode"
                  checked={mode === 'existing'}
                  onChange={() => setMode('existing')}
                  disabled={!hasExistingUnits && unitOptions.isFetched}
                />
                Use existing unit
              </label>
            </div>
            {mode === 'existing' ? (
              unitOptions.isLoading ? (
                <p className="text-xs text-stone-500">Loading units…</p>
              ) : hasExistingUnits ? (
                <select
                  className="input w-full"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  required
                >
                  {unitOptions.data!.items.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.project_name} / {u.block_name} — #{u.unit_number} ({u.unit_type_name})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-stone-500">
                  No units without a listing. Use &quot;Create new unit&quot; below.
                </p>
              )
            ) : canCreateNew ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 sm:col-span-2">
                  Project
                  <select
                    className="input mt-1 w-full"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                  >
                    {projects.data!.items.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.slug})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 sm:col-span-2">
                  Unit type
                  <select
                    className="input mt-1 w-full"
                    value={unitTypeId}
                    onChange={(e) => setUnitTypeId(e.target.value)}
                    required
                  >
                    {unitTypes.data!.items.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                  Unit number
                  <input
                    className="input mt-1 w-full"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="101"
                    required
                  />
                </label>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                  Floor (optional)
                  <input
                    className="input mt-1 w-full"
                    type="number"
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(e.target.value)}
                  />
                </label>
              </div>
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This company needs at least one project and unit type in the database (run seed or add via
                API). Location assignment can still create a project when you pick an active location below.
              </p>
            )}
          </fieldset>

          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Title
            <input
              className="input mt-1 w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Description
            <textarea
              className="input mt-1 min-h-20 w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              City
              <input className="input mt-1 w-full" value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              Area
              <input className="input mt-1 w-full" value={area} onChange={(e) => setArea(e.target.value)} />
            </label>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Location on site</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
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
          </div>

          {locationKind === 'apartment' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Building type (optional)
                <select
                  className="input mt-1 w-full"
                  value={buildingType}
                  onChange={(e) =>
                    setBuildingType(e.target.value as typeof buildingType)
                  }
                >
                  <option value="">— not set —</option>
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
                    <option value="">— select —</option>
                    <option value="retail">Retail</option>
                    <option value="residential">Residential</option>
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            Show on public site
          </label>

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
                (mode === 'existing' && !unitId) ||
                (mode === 'new' &&
                  (!unitNumber.trim() ||
                    !unitTypeId ||
                    (unitTypes.data?.items.length ?? 0) === 0 ||
                    (!projectId && !locationId.trim())))
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
