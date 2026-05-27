import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { api } from '../../api/client'
import type {
  AdminLocationContent,
  LocationCard,
  LocationMedia,
  Paginated,
} from '../../api/types'
import { getAccessToken } from '../../lib/auth'
import { AYAT_DEVELOPMENT_ZONES } from '../../lib/listingDisplay'
import { getShopLocations } from '../../lib/shopLocations'

type LocationKind = 'apartment' | 'shop'

type CreateFormState = {
  kind: LocationKind
  location_id: string
  title: string
  subtitle: string
  description: string
  video_url: string
  is_public: boolean
  cards: LocationCard[]
}

type PendingMedia = {
  url: string
  media_type: 'image' | 'video'
  caption: string
  sort_order: number
  is_primary: boolean
}

type ToastLevel = 'success' | 'error'
type ToastItem = { id: number; level: ToastLevel; message: string }

const EMPTY_CARD: LocationCard = { title: '', body: '', image_url: '' }

export function AdminListingsPage() {
  const qc = useQueryClient()
  const [selectedContentId, setSelectedContentId] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [createSubmitError, setCreateSubmitError] = useState<string | null>(null)
  const [createPendingMedia, setCreatePendingMedia] = useState<PendingMedia[]>([])
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [createForm, setCreateForm] = useState<CreateFormState>({
    kind: 'apartment',
    location_id: '',
    title: '',
    subtitle: '',
    description: '',
    video_url: '',
    is_public: true,
    cards: [{ ...EMPTY_CARD }],
  })

  const locationContent = useQuery({
    queryKey: ['admin', 'location-content'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AdminLocationContent>>('/admin/location-content', {
        params: { limit: 200 },
      })
      return data
    },
  })

  const createLocationContent = useMutation({
    mutationFn: (body: {
      kind: 'apartment' | 'shop'
      location_id: string
      title: string
      subtitle?: string
      description?: string
      video_url?: string
      cards: LocationCard[]
      is_public: boolean
    }) =>
      api.post<AdminLocationContent>('/admin/location-content', body).then((res) => res.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'location-content'] }),
  })
  const apartmentOptions = useMemo(
    () => Object.entries(AYAT_DEVELOPMENT_ZONES).map(([value, label]) => ({ value, label })),
    [],
  )
  const shopOptions = useMemo(
    () =>
      getShopLocations().map((z) => ({
        value: z.id,
        label: z.labelKey.replace('calculator.shopZones.', ''),
      })),
    [],
  )
  const locationOptions = createForm.kind === 'apartment' ? apartmentOptions : shopOptions
  const createPrimaryImageUrl =
    createPendingMedia.find((m) => m.is_primary && m.media_type === 'image')?.url ?? ''
  const closeCreateModal = () => {
    setShowCreateModal(false)
    setCreateSubmitError(null)
    setCreatePendingMedia([])
  }
  const pushToast = (level: ToastLevel, message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((prev) => [...prev, { id, level, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }

  useEffect(() => {
    if (locationOptions.length === 0) return
    setCreateForm((prev) => {
      if (prev.location_id && locationOptions.some((o) => o.value === prev.location_id)) return prev
      return {
        ...prev,
        location_id: locationOptions[0].value,
        title: locationOptions[0].label,
      }
    })
  }, [createForm.kind, locationOptions])
  const updateLocationContent = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: Partial<{
        title: string
        subtitle: string
        description: string
        video_url: string
        is_public: boolean
        cards: LocationCard[]
      }>
    }) => api.patch(`/admin/location-content/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'location-content'] }),
  })
  const seedDefaults = useMutation({
    mutationFn: async () => {
      const apartmentPayloads = apartmentOptions.map((o) => ({
        kind: 'apartment' as const,
        location_id: o.value,
        title: o.label,
        subtitle: o.label,
        description: 'Default apartment location content. Edit details, media, and cards.',
        video_url: '',
        cards: [
          { title: '2 bedrooms', body: 'Add sizes and details', image_url: '' },
          { title: '3 bedrooms', body: 'Add sizes and details', image_url: '' },
        ],
        is_public: true,
      }))
      const shopPayloads = shopOptions.map((o) => ({
        kind: 'shop' as const,
        location_id: o.value,
        title: o.label,
        subtitle: 'Ayat commercial shops',
        description: 'Default shop location content. Add floor rate context, media, and cards.',
        video_url: '',
        cards: [{ title: 'Floor rates', body: 'Add floor-by-floor details', image_url: '' }],
        is_public: true,
      }))
      for (const payload of [...apartmentPayloads, ...shopPayloads]) {
        try {
          await api.post('/admin/location-content', payload)
        } catch {
          // Ignore duplicates/conflicts; this is an idempotent helper button.
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'location-content'] })
      pushToast('success', 'Default location content seeded.')
    },
    onError: (err) => {
      pushToast('error', uploadErrorMessage(err))
    },
  })

  return (
    <div className="space-y-8 text-left">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Location details CMS</h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Manage apartment and shop detail pages in one place: description, media (image/video), bedroom
        cards, and calculator context. Users see this immediately after clicking a location card.
      </p>

      <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Location detail pages (apartments + shops)
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Configure the content users see after clicking a location: title, description, video, photos,
          and highlight cards.
        </p>
        {!selectedContentId ? (
          <p className="text-xs text-brand-700 dark:text-brand-300">
            Tip: click “Edit media/details” in the table below to open the upload section.
          </p>
        ) : null}
        <div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => seedDefaults.mutate()}
            disabled={seedDefaults.isPending}
          >
            {seedDefaults.isPending ? 'Seeding defaults...' : 'Seed default content'}
          </button>
          <button
            type="button"
            className="btn-primary ml-2"
            onClick={() => setShowCreateModal(true)}
          >
            Create location content
          </button>
        </div>

        <div className="rounded-xl border border-stone-200 dark:border-stone-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm dark:divide-stone-800">
              <thead className="bg-stone-100 dark:bg-stone-900">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Kind</th>
                  <th className="px-3 py-2 text-left font-medium">Location ID</th>
                  <th className="px-3 py-2 text-left font-medium">Title</th>
                  <th className="px-3 py-2 text-left font-medium">Public</th>
                  <th className="px-3 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white dark:divide-stone-800 dark:bg-stone-950">
                {locationContent.data?.items.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">{row.kind}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.location_id}</td>
                    <td className="px-3 py-2">{row.title}</td>
                    <td className="px-3 py-2">{row.is_public ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-xs text-brand-700 hover:underline dark:text-brand-400"
                        onClick={() => {
                          setSelectedContentId(row.id)
                          setShowEditModal(true)
                        }}
                      >
                        Edit media/details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>
      {showCreateModal ? (
        <ModalShell title="Create location content" onClose={closeCreateModal}>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault()
              setCreateSubmitError(null)
              try {
                const created = await createLocationContent.mutateAsync({
                  kind: createForm.kind,
                  location_id: createForm.location_id,
                  title: createForm.title,
                  subtitle: createForm.subtitle,
                  description: createForm.description,
                  video_url: createForm.video_url,
                  cards: createForm.cards.filter((c) => c.title.trim().length > 0),
                  is_public: createForm.is_public,
                })
                for (const media of createPendingMedia) {
                  await api.post(`/admin/location-content/${created.id}/media`, media)
                }
                pushToast('success', 'Location content created successfully.')
                closeCreateModal()
              } catch (err) {
                const message = uploadErrorMessage(err)
                setCreateSubmitError(message)
                pushToast('error', message)
              }
            }}
          >
            <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
              Kind
              <select
                name="kind"
                className="input mt-1"
                value={createForm.kind}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, kind: e.target.value as LocationKind }))
                }
              >
                <option value="apartment">Apartment</option>
                <option value="shop">Shop</option>
              </select>
            </label>
            <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
              Location
              <select
                name="location_id"
                required
                className="input mt-1"
                value={createForm.location_id}
                onChange={(e) => {
                  const nextId = e.target.value
                  const next = locationOptions.find((o) => o.value === nextId)
                  setCreateForm((prev) => ({
                    ...prev,
                    location_id: nextId,
                    title: prev.title.trim() ? prev.title : (next?.label ?? ''),
                  }))
                }}
              >
                {locationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.value})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-stone-600 dark:text-stone-400 md:col-span-2">
              Title
              <input
                name="title"
                required
                className="input mt-1"
                value={createForm.title}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </label>
            <div className="rounded border border-stone-200 p-2 dark:border-stone-800 md:col-span-2">
              <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
                Top location card image (shown on `/apartments`)
              </p>
              {createPrimaryImageUrl ? (
                <p className="mt-1 truncate text-[11px] text-stone-500 dark:text-stone-400">
                  Current cover: {createPrimaryImageUrl}
                </p>
              ) : null}
              <InlineUploadToUrlField
                accept="image/*"
                buttonLabel="Upload cover image"
                helperText="This controls the top location card image."
                onNotify={pushToast}
                onUploaded={(url) =>
                  setCreatePendingMedia((prev) => {
                    const next = prev.map((m) => ({ ...m, is_primary: false }))
                    return [
                      {
                        url,
                        media_type: 'image',
                        caption: 'Location cover',
                        sort_order: 0,
                        is_primary: true,
                      },
                      ...next,
                    ]
                  })
                }
              />
            </div>
            <label className="text-xs font-medium text-stone-600 dark:text-stone-400 md:col-span-2">
              Subtitle
              <input
                name="subtitle"
                className="input mt-1"
                value={createForm.subtitle}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, subtitle: e.target.value }))}
              />
            </label>
            <label className="text-xs font-medium text-stone-600 dark:text-stone-400 md:col-span-2">
              Description
              <textarea
                name="description"
                className="input mt-1 min-h-[90px]"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </label>
            <label className="text-xs font-medium text-stone-600 dark:text-stone-400 md:col-span-2">
              Video URL (YouTube embed link)
              <input
                name="video_url"
                className="input mt-1"
                placeholder="https://www.youtube.com/embed/..."
                value={createForm.video_url}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, video_url: e.target.value }))}
              />
              <InlineUploadToUrlField
                accept="video/*"
                buttonLabel="Upload video and fill URL"
                helperText="Upload MP4/WebM from dashboard and auto-fill this URL."
                onNotify={pushToast}
                onUploaded={(url) => setCreateForm((prev) => ({ ...prev, video_url: url }))}
              />
            </label>
            <div className="md:col-span-2">
              <CardEditor
                cards={createForm.cards}
                onChange={(cards) => setCreateForm((prev) => ({ ...prev, cards }))}
                onNotify={pushToast}
              />
            </div>
            {createSubmitError ? <p className="text-xs text-red-600 md:col-span-2">{createSubmitError}</p> : null}
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 md:col-span-2">
              <input
                name="is_public"
                type="checkbox"
                className="rounded border-stone-400"
                checked={createForm.is_public}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, is_public: e.target.checked }))}
              />
              Public on location page
            </label>
            <button type="submit" className="btn-primary md:col-span-2" disabled={createLocationContent.isPending}>
              Create location content
            </button>
          </form>
        </ModalShell>
      ) : null}
      {showEditModal ? (
        <ModalShell title="Edit media/details" onClose={() => setShowEditModal(false)}>
          <LocationContentEditor
            content={locationContent.data?.items.find((x) => x.id === selectedContentId) ?? null}
            onSave={async (id, body) => {
              await updateLocationContent.mutateAsync({ id, body })
              pushToast('success', 'Location details saved.')
            }}
            onNotify={pushToast}
          />
        </ModalShell>
      ) : null}
      <ToastViewport toasts={toasts} />
    </div>
  )
}

function LocationContentEditor({
  content,
  onSave,
  onNotify,
}: {
  content: AdminLocationContent | null
  onSave: (
    id: string,
    body: Partial<{
      title: string
      subtitle: string
      description: string
      video_url: string
      is_public: boolean
      cards: LocationCard[]
    }>,
  ) => Promise<void>
  onNotify: (level: ToastLevel, message: string) => void
}) {
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadDrag, setUploadDrag] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadSortOrder, setUploadSortOrder] = useState(0)
  const [uploadIsPrimary, setUploadIsPrimary] = useState(false)
  const [form, setForm] = useState<{
    title: string
    subtitle: string
    description: string
    video_url: string
    is_public: boolean
    cards: LocationCard[]
  }>({
    title: '',
    subtitle: '',
    description: '',
    video_url: '',
    is_public: true,
    cards: [{ ...EMPTY_CARD }],
  })
  useEffect(() => {
    if (!content) return
    setForm({
      title: content.title,
      subtitle: content.subtitle ?? '',
      description: content.description ?? '',
      video_url: content.video_url ?? '',
      is_public: content.is_public,
      cards: (content.cards?.length ? content.cards : [{ ...EMPTY_CARD }]).map((c) => ({
        title: c.title ?? '',
        body: c.body ?? '',
        image_url: c.image_url ?? '',
      })),
    })
  }, [content?.id])
  const media = useQuery({
    queryKey: ['admin', 'location-media', content?.id],
    enabled: Boolean(content?.id),
    queryFn: async () => {
      const { data } = await api.get<LocationMedia[]>(`/admin/location-content/${content!.id}/media`)
      return data
    },
  })
  const addMedia = useMutation({
    mutationFn: (body: {
      url: string
      media_type: 'image' | 'video'
      caption: string
      is_primary: boolean
      sort_order: number
    }) => api.post(`/admin/location-content/${content!.id}/media`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'location-media', content?.id] }),
  })
  const deleteMedia = useMutation({
    mutationFn: (mediaId: string) => api.delete(`/admin/location-content/${content!.id}/media/${mediaId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'location-media', content?.id] }),
  })

  if (!content) return null
  const detectedType: 'image' | 'video' = uploadFile?.type.startsWith('video/') ? 'video' : 'image'

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 p-4 dark:border-stone-800">
      <h3 className="font-semibold text-stone-900 dark:text-stone-50">
        Edit {content.kind}: {content.location_id}
      </h3>
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await onSave(content.id, {
              title: form.title,
              subtitle: form.subtitle,
              description: form.description,
              video_url: form.video_url,
              is_public: form.is_public,
              cards: form.cards.filter((c) => c.title.trim().length > 0),
            })
          } catch (err) {
            onNotify('error', uploadErrorMessage(err))
          }
        }}
      >
        <label className="text-xs font-medium text-stone-600 dark:text-stone-400 md:col-span-2">
          Title
          <input
            name="title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            className="input mt-1"
          />
        </label>
        <label className="text-xs font-medium text-stone-600 dark:text-stone-400 md:col-span-2">
          Subtitle
          <input
            name="subtitle"
            value={form.subtitle}
            onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
            className="input mt-1"
          />
        </label>
        <div className="rounded border border-stone-200 p-2 dark:border-stone-800 md:col-span-2">
          <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
            Top location card image (shown on `/apartments`)
          </p>
          <InlineUploadToUrlField
            accept="image/*"
            buttonLabel="Upload cover image"
            helperText="Uploads image and sets it as primary location media."
            onNotify={onNotify}
            onUploaded={async (url) => {
              await addMedia.mutateAsync({
                url,
                media_type: 'image',
                caption: 'Location cover',
                sort_order: 0,
                is_primary: true,
              })
            }}
          />
        </div>
        <label className="text-xs font-medium text-stone-600 dark:text-stone-400 md:col-span-2">
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="input mt-1 min-h-[80px]"
            rows={3}
          />
        </label>
        <label className="text-xs font-medium text-stone-600 dark:text-stone-400 md:col-span-2">
          Video URL
          <input
            name="video_url"
            value={form.video_url}
            onChange={(e) => setForm((prev) => ({ ...prev, video_url: e.target.value }))}
            className="input mt-1"
          />
          <InlineUploadToUrlField
            accept="video/*"
            buttonLabel="Upload video and fill URL"
            helperText="Upload MP4/WebM from dashboard and auto-fill this URL."
            onNotify={onNotify}
            onUploaded={(url) => setForm((prev) => ({ ...prev, video_url: url }))}
          />
        </label>
        <div className="md:col-span-2">
          <CardEditor
            cards={form.cards}
            onChange={(cards) => setForm((prev) => ({ ...prev, cards }))}
            onNotify={onNotify}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 md:col-span-2">
          <input
            name="is_public"
            type="checkbox"
            className="rounded border-stone-400"
            checked={form.is_public}
            onChange={(e) => setForm((prev) => ({ ...prev, is_public: e.target.checked }))}
          />
          Public on location page
        </label>
        <button type="submit" className="btn-secondary md:col-span-2">
          Save location details
        </button>
      </form>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Media gallery</h4>
        <div className="rounded-lg border border-stone-200 p-3 dark:border-stone-800">
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Upload from your machine (Cloudinary)
          </p>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            Uploads go through the API (signed Cloudinary). Set{' '}
            <span className="font-mono">CLOUDINARY_*</span> in backend <span className="font-mono">.env</span>.
          </p>
          <form
            className="mt-2 space-y-2"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!uploadFile || !uploadFile.size) return
              setUploadError(null)
              setUploading(true)
              setUploadProgress(0)
              try {
                const { secureUrl, mediaType } = await uploadMediaViaApi(uploadFile, setUploadProgress)
                await addMedia.mutateAsync({
                  url: secureUrl,
                  media_type: mediaType,
                  caption: uploadCaption,
                  sort_order: uploadSortOrder,
                  is_primary: uploadIsPrimary,
                })
                setUploadFile(null)
                setUploadCaption('')
                setUploadSortOrder(0)
                setUploadIsPrimary(false)
                onNotify('success', 'Media uploaded.')
              } catch (err) {
                const message = uploadErrorMessage(err)
                setUploadError(message)
                onNotify('error', message)
              } finally {
                setUploading(false)
              }
            }}
          >
            <label
              className={`block rounded-lg border-2 border-dashed p-4 text-center text-sm ${
                uploadDrag ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/30' : 'border-stone-300'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setUploadDrag(true)
              }}
              onDragLeave={() => setUploadDrag(false)}
              onDrop={(e) => {
                e.preventDefault()
                setUploadDrag(false)
                const file = e.dataTransfer.files?.[0]
                if (file) setUploadFile(file)
              }}
            >
              <input
                type="file"
                className="hidden"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              <span className="cursor-pointer">
                {uploadFile
                  ? `Selected: ${uploadFile.name} (${detectedType})`
                  : 'Drag & drop image/video here, or click to choose file'}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                className="input min-w-[12rem]"
                placeholder="Caption"
              />
              <input
                type="number"
                value={uploadSortOrder}
                onChange={(e) => setUploadSortOrder(Number(e.target.value || '0'))}
                className="input w-24"
              />
              <label className="flex items-center gap-1 text-xs text-stone-600">
                <input
                  type="checkbox"
                  className="rounded border-stone-400"
                  checked={uploadIsPrimary}
                  onChange={(e) => setUploadIsPrimary(e.target.checked)}
                />
                Primary
              </label>
              <button
                type="submit"
                className="btn-secondary"
                disabled={uploading || !uploadFile}
              >
                {uploading ? `Uploading… ${uploadProgress}%` : 'Upload file'}
              </button>
            </div>
            {uploading ? (
              <div className="h-2 w-full overflow-hidden rounded bg-stone-200 dark:bg-stone-800">
                <div
                  className="h-full bg-brand-600 transition-[width] duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            ) : null}
          </form>
          {uploadError ? <p className="mt-2 text-xs text-red-600">{uploadError}</p> : null}
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {media.data?.map((m) => (
            <li key={m.id} className="rounded-lg border border-stone-200 p-2 dark:border-stone-800">
              {m.media_type === 'video' ? (
                <video src={m.url} controls className="aspect-video w-full rounded bg-black" />
              ) : (
                <img src={m.url} alt={m.caption ?? ''} className="aspect-video w-full rounded object-cover" />
              )}
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-xs text-stone-500">{m.caption || m.media_type}</p>
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={async () => {
                    try {
                      await deleteMedia.mutateAsync(m.id)
                      onNotify('success', 'Media deleted.')
                    } catch (err) {
                      onNotify('error', uploadErrorMessage(err))
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-stone-500">
        Known shop IDs: {getShopLocations().map((z) => z.id).join(', ')}
      </p>
    </div>
  )
}

async function uploadMediaViaApi(
  file: File,
  onProgress: (value: number) => void,
): Promise<{ secureUrl: string; mediaType: 'image' | 'video' }> {
  const token = getAccessToken()
  if (!token) {
    throw new Error('Your admin session expired. Please log in again.')
  }
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<{ secure_url: string; media_type: 'image' | 'video' }>(
    '/admin/media/upload',
    form,
    {
      headers: { Authorization: `Bearer ${token}` },
      onUploadProgress: (evt) => {
        if (evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100))
      },
    },
  )
  return { secureUrl: data.secure_url, mediaType: data.media_type }
}

function uploadErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { detail?: { message?: string } | string } } })
      .response
    const detail = response?.data?.detail
    if (detail && typeof detail === 'object' && 'message' in detail) {
      return String(detail.message)
    }
    if (typeof detail === 'string') return detail
  }
  return err instanceof Error ? err.message : 'Upload failed'
}

function InlineUploadToUrlField({
  accept,
  buttonLabel,
  helperText,
  onNotify,
  onUploaded,
}: {
  accept: string
  buttonLabel: string
  helperText: string
  onNotify: (level: ToastLevel, message: string) => void
  onUploaded: (url: string) => void | Promise<void>
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mt-2 rounded border border-stone-200 p-2 dark:border-stone-800">
      <p className="text-[11px] text-stone-500 dark:text-stone-400">{helperText}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-900">
          Choose file
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <span className="max-w-[18rem] truncate text-xs text-stone-600 dark:text-stone-400">
          {file?.name ?? 'No file selected'}
        </span>
        <button
          type="button"
          className="btn-secondary"
          disabled={uploading || !file}
          onClick={async () => {
            if (!file || !file.size) return
            setError(null)
            setUploading(true)
            setProgress(0)
            try {
              const { secureUrl } = await uploadMediaViaApi(file, setProgress)
              await onUploaded(secureUrl)
              setFile(null)
              onNotify('success', 'Upload completed.')
            } catch (err) {
              const message = uploadErrorMessage(err)
              setError(message)
              onNotify('error', message)
            } finally {
              setUploading(false)
            }
          }}
        >
          {uploading ? `${progress}%` : buttonLabel}
        </button>
      </div>
      {uploading ? (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-stone-200 dark:bg-stone-800">
          <div className="h-full bg-brand-600 transition-[width] duration-150" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

function ToastViewport({ toasts }: { toasts: ToastItem[] }) {
  if (!toasts.length) return null
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[300] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg px-3 py-2 text-sm text-white shadow ${
            toast.level === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: import('react').ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-fg">{title}</h3>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function CardEditor({
  cards,
  onChange,
  onNotify,
}: {
  cards: LocationCard[]
  onChange: (cards: LocationCard[]) => void
  onNotify: (level: ToastLevel, message: string) => void
}) {
  const safeCards = cards.length ? cards : [{ ...EMPTY_CARD }]
  return (
    <div className="space-y-2 rounded-xl border border-stone-200 p-3 dark:border-stone-800">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-stone-600 dark:text-stone-400">Cards</p>
        <button
          type="button"
          className="text-xs text-brand-700 hover:underline dark:text-brand-300"
          onClick={() => onChange([...safeCards, { ...EMPTY_CARD }])}
        >
          + Add card
        </button>
      </div>
      {safeCards.map((card, idx) => (
        <div key={idx} className="grid gap-2 rounded-lg border border-stone-200 p-3 dark:border-stone-800">
          <input
            className="input"
            placeholder="Card title"
            value={card.title ?? ''}
            onChange={(e) => {
              const next = [...safeCards]
              next[idx] = { ...next[idx], title: e.target.value }
              onChange(next)
            }}
          />
          <textarea
            className="input min-h-[70px]"
            placeholder="Card body"
            value={card.body ?? ''}
            onChange={(e) => {
              const next = [...safeCards]
              next[idx] = { ...next[idx], body: e.target.value }
              onChange(next)
            }}
          />
          <input
            className="input"
            placeholder="Card image URL (optional)"
            value={card.image_url ?? ''}
            onChange={(e) => {
              const next = [...safeCards]
              next[idx] = { ...next[idx], image_url: e.target.value }
              onChange(next)
            }}
          />
          <InlineUploadToUrlField
            accept="image/*"
            buttonLabel="Upload image and fill URL"
            helperText="Upload image from dashboard and auto-fill this card URL."
            onNotify={onNotify}
            onUploaded={(url) => {
              const next = [...safeCards]
              next[idx] = { ...next[idx], image_url: url }
              onChange(next)
            }}
          />
          <div className="text-right">
            <button
              type="button"
              className="text-xs text-red-600 hover:underline"
              onClick={() => onChange(safeCards.filter((_, i) => i !== idx))}
            >
              Remove card
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

