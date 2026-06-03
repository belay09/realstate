import { api } from '../api/client'
import { getAccessToken } from './auth'

export async function uploadMediaViaApi(
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
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (evt) => {
        if (evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100))
      },
    },
  )
  return { secureUrl: data.secure_url, mediaType: data.media_type }
}

export function uploadErrorMessage(err: unknown): string {
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
