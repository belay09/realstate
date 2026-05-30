import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { api } from '../../api/client'
import type {
  AdminPropertyListingDetail,
  AdminPropertyListingSummary,
  ListingMetadata,
  Paginated,
  PropertyImage,
} from '../../api/types'
import { AdminCompanySelect } from '../../components/AdminCompanySelect'
import { TEMER_PARTNER } from '../../content/partners'

type EditTab = 'basics' | 'details' | 'images'

type SpecRow = { key: string; value: string }

const EMPTY_METADATA: ListingMetadata = {
  property_kind: 'residential',
  external_property_id: null,
  specs: {},
  features: { interior: [], outdoor: [], utilities: [], other: [] },
  map: null,
}

function featuresToText(items: string[]) {
  return items.join('\n')
}

function textToFeatures(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function specsToRows(specs: Record<string, string>): SpecRow[] {
  const rows = Object.entries(specs).map(([key, value]) => ({ key, value }))
  return rows.length > 0 ? rows : [{ key: '', value: '' }]
}

function rowsToSpecs(rows: SpecRow[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const row of rows) {
    const key = row.key.trim()
    const value = row.value.trim()
    if (key && value) out[key] = value
  }
  return out
}

function metadataFromDetail(detail: AdminPropertyListingDetail | undefined): ListingMetadata {
  if (!detail?.listing_metadata) return { ...EMPTY_METADATA }
  const meta = detail.listing_metadata
  return {
    property_kind: meta.property_kind || 'residential',
    external_property_id: meta.external_property_id ?? null,
    specs: meta.specs ?? {},
    features: {
      interior: meta.features?.interior ?? [],
      outdoor: meta.features?.outdoor ?? [],
      utilities: meta.features?.utilities ?? [],
      other: meta.features?.other ?? [],
    },
    map: meta.map ?? null,
  }
}

function actionError(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.detail?.message
    if (typeof message === 'string' && message.trim()) return message
  }
  if (err instanceof Error && err.message.trim()) return err.message
  return fallback
}

export function AdminPropertyListingsPage() {
  const qc = useQueryClient()
  const [companyId, setCompanyId] = useState('')
  const [search, setSearch] = useState('')
  const [publicOnly, setPublicOnly] = useState<'all' | 'public' | 'hidden'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTab, setEditTab] = useState<EditTab>('basics')

  const companies = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<{ id: string; slug: string; name: string }>>(
        '/admin/companies',
        { params: { limit: 100 } },
      )
      return data
    },
  })

  useEffect(() => {
    if (companyId || !companies.data?.items.length) return
    const temer = companies.data.items.find((c) => c.slug === TEMER_PARTNER.slug)
    setCompanyId(temer?.id ?? companies.data.items[0].id)
  }, [companies.data, companyId])

  const listings = useQuery({
    queryKey: ['admin', 'property-listings', companyId, search, publicOnly],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const params: Record<string, string | boolean> = { company_id: companyId, limit: '200' }
      if (search.trim()) params.q = search.trim()
      if (publicOnly === 'public') params.is_public = true
      if (publicOnly === 'hidden') params.is_public = false
      const { data } = await api.get<Paginated<AdminPropertyListingSummary>>('/admin/listings', {
        params,
      })
      return data
    },
  })

  const togglePublic = useMutation({
    mutationFn: ({ id, is_public }: { id: string; is_public: boolean }) =>
      api.patch(`/admin/listings/${id}`, { is_public }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'property-listings'] })
      toast.success('Visibility updated')
    },
    onError: (err) => toast.error(actionError(err, 'Could not update visibility')),
  })

  const selectedCompany = companies.data?.items.find((c) => c.id === companyId)

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Property listings</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Manage homes shown on the public site — titles, photos, detail tabs, and visibility. Temer
          cards and listing pages read directly from this data (no pricing tables required).
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <AdminCompanySelect value={companyId} onChange={setCompanyId} />
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Search
          <input
            className="input mt-1 w-56"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, area, project…"
          />
        </label>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Visibility
          <select
            className="input mt-1"
            value={publicOnly}
            onChange={(e) => setPublicOnly(e.target.value as typeof publicOnly)}
          >
            <option value="all">All</option>
            <option value="public">Public only</option>
            <option value="hidden">Hidden only</option>
          </select>
        </label>
        {selectedCompany ? (
          <Link
            to={`/apartments?company_slug=${selectedCompany.slug}`}
            className="btn-secondary text-sm"
          >
            View on site
          </Link>
        ) : null}
      </div>

      {listings.isLoading ? <p className="text-sm text-stone-500">Loading listings…</p> : null}
      {listings.isError ? (
        <p className="text-sm text-red-600">Could not load listings for this company.</p>
      ) : null}

      {listings.data && listings.data.total === 0 ? (
        <p className="text-sm text-stone-500">
          No listings found. Run the Temer seed script if this is a fresh database.
        </p>
      ) : null}

      {listings.data && listings.data.total > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:bg-stone-900">
              <tr>
                <th className="px-3 py-2">Listing</th>
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Area</th>
                <th className="px-3 py-2">Photos</th>
                <th className="px-3 py-2">Public</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {listings.data.items.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-stone-100 last:border-0 dark:border-stone-900"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {row.primary_image_url ? (
                        <img
                          src={row.primary_image_url}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-400 dark:bg-stone-900">
                          —
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-stone-900 dark:text-stone-100">{row.title}</p>
                        <p className="text-xs text-stone-500">{row.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-stone-700 dark:text-stone-300">{row.project_name}</td>
                  <td className="px-3 py-2 text-stone-600 dark:text-stone-400">{row.area ?? '—'}</td>
                  <td className="px-3 py-2 text-stone-600 dark:text-stone-400">{row.image_count}</td>
                  <td className="px-3 py-2">
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={row.is_public}
                        disabled={togglePublic.isPending}
                        onChange={(e) =>
                          togglePublic.mutate({ id: row.id, is_public: e.target.checked })
                        }
                      />
                      {row.is_public ? 'Yes' : 'No'}
                    </label>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
                      onClick={() => {
                        setEditingId(row.id)
                        setEditTab('basics')
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-stone-200 px-3 py-2 text-xs text-stone-500 dark:border-stone-800">
            {listings.data.total} listing{listings.data.total === 1 ? '' : 's'}
          </p>
        </div>
      ) : null}

      {editingId ? (
        <ListingEditModal
          listingId={editingId}
          tab={editTab}
          onTabChange={setEditTab}
          onClose={() => setEditingId(null)}
        />
      ) : null}
    </div>
  )
}

function ListingEditModal({
  listingId,
  tab,
  onTabChange,
  onClose,
}: {
  listingId: string
  tab: EditTab
  onTabChange: (tab: EditTab) => void
  onClose: () => void
}) {
  const qc = useQueryClient()
  const detail = useQuery({
    queryKey: ['admin', 'property-listing', listingId],
    queryFn: async () => {
      const { data } = await api.get<AdminPropertyListingDetail>(`/admin/listings/${listingId}`)
      return data
    },
  })

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [metadata, setMetadata] = useState<ListingMetadata>(EMPTY_METADATA)
  const [specRows, setSpecRows] = useState<SpecRow[]>([{ key: '', value: '' }])
  const [featureTexts, setFeatureTexts] = useState({
    interior: '',
    outdoor: '',
    utilities: '',
    other: '',
  })
  const [mapLat, setMapLat] = useState('')
  const [mapLng, setMapLng] = useState('')
  const [mapLabel, setMapLabel] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')

  useEffect(() => {
    if (!detail.data) return
    const d = detail.data
    setTitle(d.title)
    setSlug(d.slug)
    setDescription(d.description ?? '')
    setCity(d.city ?? '')
    setArea(d.area ?? '')
    setIsPublic(d.is_public)
    setIsFeatured(d.is_featured ?? false)
    const meta = metadataFromDetail(d)
    setMetadata(meta)
    setSpecRows(specsToRows(meta.specs))
    setFeatureTexts({
      interior: featuresToText(meta.features.interior),
      outdoor: featuresToText(meta.features.outdoor),
      utilities: featuresToText(meta.features.utilities),
      other: featuresToText(meta.features.other),
    })
    setMapLat(meta.map?.latitude != null ? String(meta.map.latitude) : '')
    setMapLng(meta.map?.longitude != null ? String(meta.map.longitude) : '')
    setMapLabel(meta.map?.label ?? '')
  }, [detail.data])

  const saveListing = useMutation({
    mutationFn: async () => {
      const lat = mapLat.trim() ? Number(mapLat) : NaN
      const lng = mapLng.trim() ? Number(mapLng) : NaN
      const map =
        Number.isFinite(lat) && Number.isFinite(lng)
          ? { latitude: lat, longitude: lng, label: mapLabel.trim() || title.trim() || null }
          : null
      const listing_metadata: ListingMetadata = {
        property_kind: metadata.property_kind,
        external_property_id: metadata.external_property_id,
        specs: rowsToSpecs(specRows),
        features: {
          interior: textToFeatures(featureTexts.interior),
          outdoor: textToFeatures(featureTexts.outdoor),
          utilities: textToFeatures(featureTexts.utilities),
          other: textToFeatures(featureTexts.other),
        },
        map,
      }
      await api.patch(`/admin/listings/${listingId}`, {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        city: city.trim() || null,
        area: area.trim() || null,
        is_public: isPublic,
        is_featured: isFeatured,
        listing_metadata,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'property-listing', listingId] })
      qc.invalidateQueries({ queryKey: ['admin', 'property-listings'] })
      toast.success('Listing saved')
    },
    onError: (err) => toast.error(actionError(err, 'Could not save listing')),
  })

  const addImage = useMutation({
    mutationFn: (url: string) =>
      api.post(`/admin/listings/${listingId}/images`, {
        url,
        is_primary: (detail.data?.images.length ?? 0) === 0,
        sort_order: detail.data?.images.length ?? 0,
      }),
    onSuccess: () => {
      setNewImageUrl('')
      qc.invalidateQueries({ queryKey: ['admin', 'property-listing', listingId] })
      qc.invalidateQueries({ queryKey: ['admin', 'property-listings'] })
      toast.success('Image added')
    },
    onError: (err) => toast.error(actionError(err, 'Could not add image')),
  })

  const setPrimaryImage = useMutation({
    mutationFn: (imageId: string) =>
      api.patch(`/admin/listings/${listingId}/images/${imageId}`, { is_primary: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'property-listing', listingId] })
      qc.invalidateQueries({ queryKey: ['admin', 'property-listings'] })
    },
    onError: (err) => toast.error(actionError(err, 'Could not set primary image')),
  })

  const deleteImage = useMutation({
    mutationFn: (imageId: string) => api.delete(`/admin/listings/${listingId}/images/${imageId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'property-listing', listingId] })
      qc.invalidateQueries({ queryKey: ['admin', 'property-listings'] })
      toast.success('Image removed')
    },
    onError: (err) => toast.error(actionError(err, 'Could not remove image')),
  })

  const tabClass = (id: EditTab) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      tab === id
        ? 'bg-brand-100 text-brand-900 dark:bg-brand-950 dark:text-brand-100'
        : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900'
    }`

  const images = detail.data?.images ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="my-4 w-full max-w-3xl rounded-2xl border border-stone-200 bg-white shadow-xl dark:border-stone-800 dark:bg-stone-950"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4 dark:border-stone-800">
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Edit listing</h2>
            {detail.data ? (
              <p className="mt-1 text-sm text-stone-500">
                {detail.data.company_name} · {detail.data.project_name}
                {detail.data.bedrooms != null ? ` · ${detail.data.bedrooms} bed` : ''}
              </p>
            ) : null}
          </div>
          <button type="button" className="text-sm text-stone-500 hover:text-stone-800" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-stone-200 px-5 py-3 dark:border-stone-800">
          <button type="button" className={tabClass('basics')} onClick={() => onTabChange('basics')}>
            Basics
          </button>
          <button type="button" className={tabClass('details')} onClick={() => onTabChange('details')}>
            Detail tabs
          </button>
          <button type="button" className={tabClass('images')} onClick={() => onTabChange('images')}>
            Photos ({images.length})
          </button>
          {detail.data ? (
            <Link
              to={`/listings/${detail.data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-sm font-medium text-brand-700 underline dark:text-brand-300"
            >
              Preview public page ↗
            </Link>
          ) : null}
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {detail.isLoading ? <p className="text-sm text-stone-500">Loading…</p> : null}
          {detail.isError ? <p className="text-sm text-red-600">Could not load listing.</p> : null}

          {tab === 'basics' && detail.data ? (
            <div className="space-y-4">
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Title
                <input className="input mt-1 w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                URL slug
                <input className="input mt-1 w-full font-mono text-sm" value={slug} onChange={(e) => setSlug(e.target.value)} />
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
                </label>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                  Area
                  <input className="input mt-1 w-full" value={area} onChange={(e) => setArea(e.target.value)} />
                </label>
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                  Show on public site
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                  Featured
                </label>
              </div>
            </div>
          ) : null}

          {tab === 'details' && detail.data ? (
            <div className="space-y-5">
              <p className="text-sm text-stone-600 dark:text-stone-400">
                These fields power the Overview, Details, Features, and Map tabs on the public listing
                page.
              </p>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                Property kind
                <select
                  className="input mt-1"
                  value={metadata.property_kind}
                  onChange={(e) => setMetadata((m) => ({ ...m, property_kind: e.target.value }))}
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </label>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Specs</p>
                {specRows.map((row, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      className="input flex-1"
                      placeholder="Label (e.g. Property Size)"
                      value={row.key}
                      onChange={(e) =>
                        setSpecRows((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, key: e.target.value } : r)),
                        )
                      }
                    />
                    <input
                      className="input flex-1"
                      placeholder="Value"
                      value={row.value}
                      onChange={(e) =>
                        setSpecRows((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, value: e.target.value } : r)),
                        )
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => setSpecRows((rows) => [...rows, { key: '', value: '' }])}
                >
                  Add spec row
                </button>
              </div>

              {(['interior', 'outdoor', 'utilities', 'other'] as const).map((group) => (
                <label key={group} className="block text-xs font-medium capitalize text-stone-600 dark:text-stone-400">
                  {group} features (one per line)
                  <textarea
                    className="input mt-1 min-h-20 w-full font-mono text-sm"
                    value={featureTexts[group]}
                    onChange={(e) => setFeatureTexts((prev) => ({ ...prev, [group]: e.target.value }))}
                  />
                </label>
              ))}

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                  Map latitude
                  <input className="input mt-1 w-full" value={mapLat} onChange={(e) => setMapLat(e.target.value)} />
                </label>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                  Map longitude
                  <input className="input mt-1 w-full" value={mapLng} onChange={(e) => setMapLng(e.target.value)} />
                </label>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                  Map label
                  <input className="input mt-1 w-full" value={mapLabel} onChange={(e) => setMapLabel(e.target.value)} />
                </label>
              </div>
            </div>
          ) : null}

          {tab === 'images' && detail.data ? (
            <div className="space-y-4">
              <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  const url = newImageUrl.trim()
                  if (!url) return
                  addImage.mutate(url)
                }}
              >
                <label className="block min-w-0 flex-1 text-xs font-medium text-stone-600 dark:text-stone-400">
                  Image URL
                  <input
                    className="input mt-1 w-full font-mono text-sm"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </label>
                <button type="submit" className="btn-secondary" disabled={addImage.isPending}>
                  Add photo
                </button>
              </form>

              {images.length === 0 ? (
                <p className="text-sm text-stone-500">No photos yet. The card thumbnail uses the primary image.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {images.map((img) => (
                    <ImageRow
                      key={img.id}
                      image={img}
                      onPrimary={() => setPrimaryImage.mutate(img.id)}
                      onDelete={() => deleteImage.mutate(img.id)}
                      busy={setPrimaryImage.isPending || deleteImage.isPending}
                    />
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        {tab !== 'images' ? (
          <div className="flex justify-end gap-2 border-t border-stone-200 px-5 py-4 dark:border-stone-800">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={saveListing.isPending || !detail.data}
              onClick={() => saveListing.mutate()}
            >
              {saveListing.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        ) : (
          <div className="border-t border-stone-200 px-5 py-4 text-right dark:border-stone-800">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ImageRow({
  image,
  onPrimary,
  onDelete,
  busy,
}: {
  image: PropertyImage
  onPrimary: () => void
  onDelete: () => void
  busy: boolean
}) {
  return (
    <li className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
      <img src={image.url} alt="" className="aspect-video w-full object-cover" />
      <div className="flex flex-wrap items-center justify-between gap-2 p-2">
        {image.is_primary ? (
          <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">Primary</span>
        ) : (
          <button type="button" className="text-xs font-medium underline" disabled={busy} onClick={onPrimary}>
            Set primary
          </button>
        )}
        <button
          type="button"
          className="text-xs text-red-600 hover:underline"
          disabled={busy}
          onClick={onDelete}
        >
          Remove
        </button>
      </div>
    </li>
  )
}
