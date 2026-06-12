import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '../../api/client'
import type { AdminLocationContent, LocationCard, LocationMedia } from '../../api/types'

type Props = {
  source: AdminLocationContent
  onClose: () => void
  onSuccess: () => void
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

export function DuplicateLocationModal({ source, onClose, onSuccess }: Props) {
  const [locationId, setLocationId] = useState(`${source.location_id}-copy`)
  const [title, setTitle] = useState(`Copy of ${source.title}`)
  const [isPublic, setIsPublic] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextId = slugify(locationId)
    if (!nextId) {
      toast.error('Location ID is required.')
      return
    }
    if (!title.trim()) {
      toast.error('Title is required.')
      return
    }
    setPending(true)
    try {
      const { data: created } = await api.post<AdminLocationContent>('/admin/location-content', {
        kind: source.kind,
        location_id: nextId,
        company_slug: source.company_slug,
        title: title.trim(),
        subtitle: source.subtitle ?? undefined,
        description: source.description ?? undefined,
        video_url: source.video_url ?? undefined,
        cards: (source.cards ?? []) as LocationCard[],
        settings: source.settings ?? undefined,
        is_public: isPublic,
      })
      const { data: media } = await api.get<LocationMedia[]>(
        `/admin/location-content/${source.id}/media`,
      )
      for (const item of media) {
        await api.post(`/admin/location-content/${created.id}/media`, {
          url: item.url,
          media_type: item.media_type,
          caption: item.caption ?? undefined,
          sort_order: item.sort_order,
          is_primary: item.is_primary,
        })
      }
      toast.success(`Location duplicated as “${title.trim()}”.`)
      onSuccess()
      onClose()
    } catch {
      toast.error('Could not duplicate location. Check the new slug is unique.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/50 p-4">
      <form
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl"
        onSubmit={(e) => void handleSubmit(e)}
      >
        <h3 className="text-lg font-semibold text-fg">Duplicate location page</h3>
        <p className="mt-1 text-sm text-fg-muted">
          Copy text, cards, building settings, and media links from{' '}
          <strong className="text-fg">{source.title}</strong> ({source.location_id}). You can edit
          everything after.
        </p>

        <label className="mt-4 block text-xs font-medium text-fg-muted">
          New location ID (slug)
          <input
            className="input mt-1 font-mono text-sm"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            required
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-fg-muted">
          New title
          <input
            className="input mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Active on public site
        </label>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? 'Duplicating…' : 'Create duplicate'}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={pending}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
