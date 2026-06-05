import { useMemo, useState } from 'react'
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
  sourceProjectSlug: string
  sourceProjectName: string
  listings: AdminPropertyListingSummary[]
  locationPages: AdminLocationContent[]
  onSuccess: () => void
}

function metadataClone(meta: ListingMetadata | null | undefined): ListingMetadata | null {
  if (!meta) return null
  return JSON.parse(JSON.stringify(meta)) as ListingMetadata
}

export function CopyListingsPanel({
  companyId,
  sourceProjectSlug,
  sourceProjectName,
  listings,
  locationPages,
  onSuccess,
}: Props) {
  const sourceListings = useMemo(
    () => listings.filter((row) => row.project_slug === sourceProjectSlug),
    [listings, sourceProjectSlug],
  )

  const [targetLocationId, setTargetLocationId] = useState('')
  const [copyImages, setCopyImages] = useState(true)
  const [isPublic, setIsPublic] = useState(false)
  const [pending, setPending] = useState(false)

  const sourceKind: LocationKind =
    locationPages.find((row) => row.location_id === sourceProjectSlug)?.kind === 'shop'
      ? 'shop'
      : 'apartment'

  const targetOptions = useMemo(
    () =>
      locationPages.filter(
        (row) => row.is_public && row.kind === sourceKind && row.location_id !== sourceProjectSlug,
      ),
    [locationPages, sourceKind, sourceProjectSlug],
  )

  if (sourceListings.length === 0) return null

  async function handleCopyAll() {
    if (!targetLocationId) {
      toast.error('Pick a target location.')
      return
    }
    setPending(true)
    let copied = 0
    try {
      for (const summary of sourceListings) {
        const { data: d } = await api.get<AdminPropertyListingDetail>(`/admin/listings/${summary.id}`)
        const { data: u } = await api.get<PropertyUnit>(`/admin/units/${d.unit_id}`)
        const kind = d.location_kind === 'shop' ? 'shop' : 'apartment'
        await duplicatePropertyListing({
          companyId,
          source: d,
          sourceUnit: u,
          title: `Copy of ${d.title}`,
          locationKind: kind,
          locationId: targetLocationId,
          locationPages,
          city: d.city,
          area: d.area,
          description: d.description,
          listingMetadata: metadataClone(d.listing_metadata),
          floorNumber: u.floor_number,
          unitNumber: '',
          isPublic,
          copyImages,
        })
        copied += 1
      }
      toast.success(`Copied ${copied} listing(s) to ${targetLocationId}.`)
      setTargetLocationId('')
      onSuccess()
    } catch {
      toast.error(
        copied > 0
          ? `Copied ${copied} of ${sourceListings.length}. Refresh and finish the rest.`
          : 'Could not copy listings.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="rounded-xl border-2 border-brand-300/80 bg-brand-50/70 p-4 dark:border-brand-700/60 dark:bg-brand-950/30">
      <h2 className="text-sm font-bold text-brand-900 dark:text-brand-100">
        Copy all listings to another location
      </h2>
      <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
        Copy every listing from <strong>{sourceProjectName}</strong> ({sourceListings.length}) —
        titles, details, specs, and photos — without re-entering each one.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block min-w-[14rem] flex-1 text-xs font-medium text-stone-700 dark:text-stone-300">
          Copy to location
          <select
            className="input mt-1"
            value={targetLocationId}
            onChange={(e) => setTargetLocationId(e.target.value)}
          >
            <option value="">Select location…</option>
            {targetOptions.map((row) => (
              <option key={row.id} value={row.location_id}>
                {row.title} ({row.location_id})
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-stone-600">
          <input type="checkbox" checked={copyImages} onChange={(e) => setCopyImages(e.target.checked)} />
          Copy photos
        </label>
        <label className="flex items-center gap-2 text-xs text-stone-600">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Public
        </label>
        <button
          type="button"
          className="btn-primary"
          disabled={pending || !targetLocationId}
          onClick={() => void handleCopyAll()}
        >
          {pending ? 'Copying…' : `Copy ${sourceListings.length} listings`}
        </button>
      </div>
      {targetOptions.length === 0 ? (
        <p className="mt-2 text-xs text-stone-500">
          Add another Active {sourceKind} location under Location pages first.
        </p>
      ) : null}
    </section>
  )
}
