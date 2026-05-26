import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '../../api/client'
import type { Paginated, PropertyListing } from '../../api/types'

export function AdminListingsPage() {
  const qc = useQueryClient()
  const [imageListingId, setImageListingId] = useState('')

  const listings = useQuery({
    queryKey: ['admin', 'listings'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<PropertyListing>>('/admin/listings', {
        params: { limit: 100 },
      })
      return data
    },
  })

  const create = useMutation({
    mutationFn: (body: {
      unit_id: string
      title: string
      description: string
      city: string
      area: string
      is_public: boolean
    }) => api.post('/admin/listings', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'listings'] }),
  })

  const patch = useMutation({
    mutationFn: ({ id, is_public }: { id: string; is_public: boolean }) =>
      api.patch(`/admin/listings/${id}`, { is_public }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'listings'] }),
  })

  return (
    <div className="space-y-8 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Listings</h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Create a listing for a unit, then mark it <strong>public</strong> and ensure the unit is{' '}
        <strong>available</strong> so it appears on the public site.
      </p>

      <form
        className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          create.mutate({
            unit_id: String(fd.get('unit_id')),
            title: String(fd.get('title')),
            description: String(fd.get('description') ?? ''),
            city: String(fd.get('city') ?? ''),
            area: String(fd.get('area') ?? ''),
            is_public: fd.get('is_public') === 'on',
          })
          e.currentTarget.reset()
        }}
      >
        <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">New listing</h2>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Unit ID (UUID)
          <input name="unit_id" required className="input font-mono text-xs" />
        </label>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Title
          <input name="title" required className="input" />
        </label>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Description
          <textarea name="description" className="input min-h-[80px]" rows={3} />
        </label>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          City
          <input name="city" className="input" />
        </label>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Area
          <input name="area" className="input" />
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
          <input name="is_public" type="checkbox" className="rounded border-stone-400" />
          Public on website
        </label>
        <button type="submit" className="btn-primary" disabled={create.isPending}>
          Create listing
        </button>
      </form>

      {listings.isLoading && <p className="text-sm text-stone-500">Loading…</p>}

      {listings.data && (
        <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
          <table className="min-w-full divide-y divide-stone-200 text-sm dark:divide-stone-800">
            <thead className="bg-stone-100 dark:bg-stone-900">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Slug</th>
                <th className="px-3 py-2 text-left font-medium">Public</th>
                <th className="px-3 py-2 text-left font-medium"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white dark:divide-stone-800 dark:bg-stone-950">
              {listings.data.items.map((L) => (
                <tr key={L.id}>
                  <td className="px-3 py-2 font-medium">{L.title}</td>
                  <td className="px-3 py-2 font-mono text-xs text-stone-600 dark:text-stone-400">{L.slug}</td>
                  <td className="px-3 py-2">{L.is_public ? 'Yes' : 'No'}</td>
                  <td className="space-x-2 px-3 py-2">
                    <button
                      type="button"
                      className="text-xs text-brand-700 hover:underline dark:text-brand-400"
                      onClick={() => patch.mutate({ id: L.id, is_public: !L.is_public })}
                    >
                      Toggle public
                    </button>
                    <Link
                      to={`/listings/${L.slug}`}
                      className="text-xs text-stone-600 hover:underline dark:text-stone-400"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {listings.data && listings.data.items.length > 0 ? (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Manage images for listing
            <select
              className="input mt-1 max-w-lg"
              value={imageListingId || listings.data.items[0]?.id || ''}
              onChange={(e) => setImageListingId(e.target.value)}
            >
              {listings.data.items.map((L) => (
                <option key={L.id} value={L.id}>
                  {L.title}
                </option>
              ))}
            </select>
          </label>
          {(() => {
            const id = imageListingId || listings.data.items[0]?.id
            const L = listings.data.items.find((x) => x.id === id)
            return id && L ? <ListingImagesPanel listingId={id} title={L.title} /> : null
          })()}
        </div>
      ) : null}
    </div>
  )
}

function ListingImagesPanel({ listingId, title }: { listingId: string; title: string }) {
  const qc = useQueryClient()
  const images = useQuery({
    queryKey: ['admin', 'listing-images', listingId],
    queryFn: async () => {
      const { data } = await api.get<{ id: string; url: string; is_primary: boolean; sort_order: number }[]>(
        `/admin/listings/${listingId}/images`,
      )
      return data
    },
  })

  const addImage = useMutation({
    mutationFn: (url: string) =>
      api.post(`/admin/listings/${listingId}/images`, { url, is_primary: images.data?.length === 0, sort_order: 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'listing-images', listingId] }),
  })

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
      <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Images for {title}</h2>
      <form
        className="mt-2 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          addImage.mutate(String(fd.get('url')))
          e.currentTarget.reset()
        }}
      >
        <input name="url" required className="input min-w-[16rem] flex-1" placeholder="https://… image URL" />
        <button type="submit" className="btn-secondary" disabled={addImage.isPending}>
          Add image URL
        </button>
      </form>
      <ul className="mt-3 flex flex-wrap gap-2">
        {images.data?.map((img) => (
          <li key={img.id}>
            <img src={img.url} alt="" className="h-20 w-28 rounded-lg object-cover" />
          </li>
        ))}
      </ul>
    </div>
  )
}
