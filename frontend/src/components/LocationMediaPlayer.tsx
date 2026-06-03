import { isEmbedVideoUrl } from '../lib/videoEmbedUrl'

type LocationMediaPlayerProps = {
  url: string
  title?: string
  /** Fill a tall hero column (no fixed 16:9 box). */
  variant?: 'default' | 'hero'
}

export function LocationMediaPlayer({
  url,
  title = 'Location video',
  variant = 'default',
}: LocationMediaPlayerProps) {
  const embed = isEmbedVideoUrl(url)
  const isHero = variant === 'hero'

  return (
    <div
      className={`group overflow-hidden bg-slate-950 ${
        isHero
          ? 'h-full min-h-[240px] rounded-2xl shadow-lg ring-1 ring-black/10 dark:ring-white/10'
          : 'rounded-2xl border border-border shadow-[0_24px_48px_-12px_rgba(15,23,42,0.35)] ring-1 ring-brand-500/10 transition duration-500 hover:shadow-[0_32px_64px_-12px_rgba(2,132,199,0.4)] hover:ring-brand-400/25 dark:ring-white/10'
      }`}
    >
      {embed ? (
        <div className={isHero ? 'flex h-full min-h-[240px] items-center' : 'aspect-video w-full'}>
          <iframe
            src={url}
            className={isHero ? 'aspect-video w-full' : 'h-full w-full'}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <video
          src={url}
          controls
          playsInline
          className={
            isHero
              ? 'h-full min-h-[240px] w-full bg-black object-cover'
              : 'aspect-video w-full bg-black object-contain'
          }
        />
      )}
    </div>
  )
}
