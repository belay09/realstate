import { useState } from 'react'

import { uploadErrorMessage, uploadMediaViaApi } from '../../lib/adminMediaUpload'

type AdminPhotoUploadFieldProps = {
  onUploaded: (url: string) => void | Promise<void>
  disabled?: boolean
  buttonLabel?: string
}

export function AdminPhotoUploadField({
  onUploaded,
  disabled = false,
  buttonLabel = 'Upload photo',
}: AdminPhotoUploadFieldProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function uploadSelected(selected: File | null) {
    if (!selected?.size || disabled || uploading) return
    setError(null)
    setUploading(true)
    setProgress(0)
    try {
      const { secureUrl, mediaType } = await uploadMediaViaApi(selected, setProgress)
      if (mediaType !== 'image') {
        throw new Error('Only image files are supported for listing photos.')
      }
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
      <p className="text-xs font-medium text-stone-700 dark:text-stone-300">Upload from your computer</p>
      <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
        JPEG, PNG, or WebP. Drag and drop here or choose a file. Requires CLOUDINARY_* in backend .env.
      </p>
      <label
        className={`mt-3 block cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition ${
          dragOver
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
            : 'border-stone-300 hover:border-brand-400 dark:border-stone-600'
        } ${disabled || uploading ? 'pointer-events-none opacity-60' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const dropped = e.dataTransfer.files?.[0]
          if (dropped?.type.startsWith('image/')) {
            setFile(dropped)
            void uploadSelected(dropped)
          } else {
            setError('Please drop an image file.')
          }
        }}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            const picked = e.target.files?.[0] ?? null
            setFile(picked)
            setError(null)
          }}
        />
        <span className="text-sm text-stone-600 dark:text-stone-400">
          {uploading ? `Uploading… ${progress}%` : 'Drop an image here or click to browse'}
        </span>
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {file && !uploading ? (
          <span className="max-w-[14rem] truncate text-xs text-stone-600 dark:text-stone-400">{file.name}</span>
        ) : null}
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
