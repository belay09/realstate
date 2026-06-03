import { useState } from 'react'

import { uploadErrorMessage, uploadMediaViaApi } from '../../lib/adminMediaUpload'

type AdminVideoUploadFieldProps = {
  onUploaded: (url: string) => void | Promise<void>
  disabled?: boolean
  buttonLabel?: string
}

export function AdminVideoUploadField({
  onUploaded,
  disabled = false,
  buttonLabel = 'Upload video',
}: AdminVideoUploadFieldProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function uploadSelected(selected: File | null) {
    if (!selected?.size || disabled || uploading) return
    setError(null)
    setUploading(true)
    setProgress(0)
    try {
      const { secureUrl } = await uploadMediaViaApi(selected, setProgress)
      await onUploaded(secureUrl)
      setFile(null)
    } catch (err) {
      setError(uploadErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-4 dark:border-stone-800 dark:bg-stone-900/40">
      <p className="text-xs font-medium text-stone-700 dark:text-stone-300">Upload video file</p>
      <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
        MP4 or WebM. Uploads to Cloudinary (CLOUDINARY_* in backend .env).
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-950 dark:hover:bg-stone-900">
          Choose file
          <input
            type="file"
            accept="video/*"
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setError(null)
            }}
          />
        </label>
        <span className="max-w-[14rem] truncate text-xs text-stone-600 dark:text-stone-400">
          {file?.name ?? 'No file selected'}
        </span>
        <button
          type="button"
          className="btn-primary text-xs"
          disabled={disabled || uploading || !file}
          onClick={() => void uploadSelected(file)}
        >
          {uploading ? `Uploading… ${progress}%` : buttonLabel}
        </button>
      </div>
      {uploading ? (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded bg-stone-200 dark:bg-stone-800">
          <div
            className="h-full bg-brand-600 transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
