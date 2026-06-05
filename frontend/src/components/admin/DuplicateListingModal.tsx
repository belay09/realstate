import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { api } from '../../api/client'
import type {
  AdminLocationContent,
  AdminPropertyListingDetail,
  AdminPropertyListingSummary,
  ListingMetadata,
  Paginated,
  PropertyUnit,
} from '../../api/types'
import { duplicatePropertyListing } from '../../lib/duplicatePropertyListing'

type LocationKind = 'apartment' | 'shop'

type Props = {
  companyId: string
  sourceSummary: AdminPropertyListingSummary
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

function metadataFromDetail(detail: AdminPropertyListingDetail): ListingMetadata | null {
  if (!detail.listing_metadata) return null
  return JSON.parse(JSON.stringify(detail.listing_metadata)) as ListingMetadata
}

export function DuplicateListingModal({ companyId, sourceSummary, onClose, onCreated }: Props) {
  const detail = useQuery({
    queryKey: ['admin', 'property-listing', 'duplicate', sourceSummary.id],
    queryFn: async () => {
      const { data } = await api.get<AdminPropertyListingDetail>(
        `/admin/listings/${sourceSummary.id}`,
      )
      return data
    },
  })

  const unit = useQuery({
    queryKey: ['admin', 'unit', detail.data?.unit_id],
    enabled: Boolean(detail.data?.unit_id),
    queryFn: async () => {
      const { data } = await api.get<PropertyUnit>(`/admin/units/${detail.data!.unit_id}`)
      return data
    },
  })

  const locationPages = useQuery({
    queryKey: ['admin', 'location-content', 'duplicate-listing'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AdminLocationContent>>('/admin/location-content', {
        params: { limit: 200 },
      })
      return data
    },
  })

  const [title, setTitle] = useState('')
  const [locationKind, setLocationKind] = useState<LocationKind>('apartment')
  const [locationId, setLocationId] = useState('')
  const [floorNumber, setFloorNumber] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [copyImages, setCopyImages] = useState(true)
  const [isPublic, setIsPublic] = useState(true)

  useEffect(() => {
    if (!detail.data) return
    setTitle(`Copy of ${detail.data.title}`)
    const kind = detail.data.location_kind === 'shop' ? 'shop' : 'apartment'
    setLocationKind(kind)
    setLocationId(detail.data.location_id ?? detail.data.project_slug ?? '')
  }, [detail.data])

  useEffect(() => {
    if (unit.data?.floor_number == null) return
    setFloorNumber(String(unit.data.floor_number))
  }, [unit.data?.floor_number])

  const activeLocations = useMemo(
    () => (locationPages.data?.items ?? []).filter((row) => row.is_public),
    [locationPages.data?.items],
  )

  const locationOptions = useMemo(
    () => activeLocations.filter((row) => row.kind === locationKind),
    [activeLocations, locationKind],
  )

  const duplicate = useMutation({
    mutationFn: async () => {
      if (!detail.data || !unit.data) throw new Error('Listing not loaded')
      const floor = floorNumber.trim() ? Number(floorNumber) : null
      return duplicatePropertyListing({
        companyId,
        source: detail.data,
        sourceUnit: unit.data,
        title,
        locationKind,
        locationId,
        locationPages: locationPages.data?.items ?? [],
        city: detail.data.city,
        area: detail.data.area,
        description: detail.data.description,
        listingMetadata: metadataFromDetail(detail.data),
        floorNumber: Number.isFinite(floor) ? floor : null,
        unitNumber,
        isPublic,
        copyImages,
      })
    },
    onSuccess: (id) => {
      toast.success('Listing duplicated — review title and photos')
      onCreated(id)
    },
    onError: (err) => toast.error(actionError(err, 'Could not duplicate listing')),
  })

  const loading = detail.isLoading || unit.isLoading

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-stone-200 bg-white p-5 shadow-xl dark:border-stone-800 dark:bg-stone-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Copy listing to another location
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Reuses description, details, specs, and photos from{' '}
              <strong>{sourceSummary.title}</strong>. Pick a new title and location.
            </p>
          </div>
          <button type="button" className="text-sm text-stone-500 hover:underline" onClick={onClose}>
            Close
          </button>
        </div>

        {loading ? <p className="mt-4 text-sm text-stone-500">Loading listing…</p> : null}
        {detail.isError ? (
          <p className="mt-4 text-sm text-red-600">Could not load listing to copy.</p>
        ) : null}

        {detail.data && unit.data ? (
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              duplicate.mutate()
            }}
          >
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              New title
              <input
                className="input mt-1 w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Type
                <select
                  className="input mt-1 w-full"
                  value={locationKind}
                  onChange={(e) => {
                    setLocationKind(e.target.value as LocationKind)
                    setLocationId('')
                  }}
                >
                  <option value="apartment">Apartment</option>
                  <option value="shop">Shop</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Target location
                <select
                  className="input mt-1 w-full"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  required
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

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Floor (optional)
                <input
                  className="input mt-1 w-full"
                  type="number"
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(e.target.value)}
                />
              </label>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Unit number (optional)
                <input
                  className="input mt-1 w-full font-mono text-sm"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="Auto if blank"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={copyImages}
                onChange={(e) => setCopyImages(e.target.checked)}
              />
              Copy photos (same image URLs)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Show on public site (required for visitors to see this listing)
            </label>
            {locationId ? (
              <p className="text-xs text-stone-500">
                Appears on{' '}
                <span className="font-mono text-stone-700 dark:text-stone-300">
                  /apartments/{locationId}
                </span>{' '}
                when Public is on.
              </p>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-stone-200 pt-4 dark:border-stone-800">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={duplicate.isPending || !title.trim() || !locationId.trim()}
              >
                {duplicate.isPending ? 'Copying…' : 'Copy listing'}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )
}
