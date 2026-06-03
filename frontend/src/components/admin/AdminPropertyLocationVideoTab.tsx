import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { api } from '../../api/client'
import type { AdminLocationContent, Paginated } from '../../api/types'
import { AdminVideoUploadField } from './AdminVideoUploadField'

type AdminPropertyLocationVideoTabProps = {
  projectSlug: string
  projectName: string
  locationKind?: 'apartment' | 'shop'
}

export function AdminPropertyLocationVideoTab({
  projectSlug,
  projectName,
  locationKind = 'apartment',
}: AdminPropertyLocationVideoTabProps) {
  const qc = useQueryClient()
  const [videoUrl, setVideoUrl] = useState('')

  const locationContent = useQuery({
    queryKey: ['admin', 'location-content', locationKind, projectSlug],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AdminLocationContent>>('/admin/location-content', {
        params: { kind: locationKind, limit: 200 },
      })
      return data.items.find((row) => row.location_id === projectSlug) ?? null
    },
  })

  const content = locationContent.data

  useEffect(() => {
    setVideoUrl(content?.video_url ?? '')
  }, [content?.id, content?.video_url])

  const saveVideo = useMutation({
    mutationFn: (url: string) => {
      if (!content) throw new Error('No location page')
      return api.patch(`/admin/location-content/${content.id}`, {
        video_url: url.trim() || null,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'location-content'] })
      qc.invalidateQueries({ queryKey: ['public-location-content'] })
      toast.success('Location video saved')
    },
    onError: () => toast.error('Could not save video'),
  })

  if (locationContent.isLoading) {
    return <p className="text-sm text-stone-500">Loading location page…</p>
  }

  if (!content) {
    return (
      <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="font-medium text-amber-950 dark:text-amber-100">No location page for {projectName}</p>
        <p className="text-amber-900/90 dark:text-amber-200/90">
          Create zone content under{' '}
          <Link to="/admin/listings" className="font-semibold underline">
            Location pages
          </Link>{' '}
          with location ID <span className="font-mono">{projectSlug}</span>, then set the video here.
        </p>
      </div>
    )
  }

  const isEmbed = /youtube\.com|youtu\.be|vimeo\.com/i.test(videoUrl)

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600 dark:text-stone-400">
        This video appears on the public <strong>{projectName}</strong> location page (shared for all
        homes in this zone), not on a single listing.
      </p>

      <AdminVideoUploadField
        disabled={saveVideo.isPending}
        buttonLabel="Upload & use URL"
        onUploaded={async (url) => {
          setVideoUrl(url)
          await saveVideo.mutateAsync(url)
        }}
      />

      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
        Video URL
        <input
          className="input mt-1 w-full font-mono text-sm"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://… (YouTube embed or MP4)"
        />
      </label>

      {videoUrl.trim() ? (
        <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
          {isEmbed ? (
            <iframe src={videoUrl} className="aspect-video w-full" title="Video preview" />
          ) : (
            <video src={videoUrl} controls className="aspect-video w-full bg-black" />
          )}
        </div>
      ) : null}

      <button
        type="button"
        className="btn-primary"
        disabled={saveVideo.isPending}
        onClick={() => saveVideo.mutate(videoUrl)}
      >
        {saveVideo.isPending ? 'Saving…' : 'Save video'}
      </button>
    </div>
  )
}
