import { useEffect, useRef, useState } from 'react'

import { buildAutoplayEmbedUrl, isEmbedVideoUrl } from '../lib/videoEmbedUrl'

type HeroLocationVideoProps = {
  url: string
  title?: string
  badgeLabel?: string
}

export function HeroLocationVideo({
  url,
  title = 'Location video',
  badgeLabel = 'Site tour',
}: HeroLocationVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const embed = isEmbedVideoUrl(url)

  useEffect(() => {
    const el = videoRef.current
    if (!el || embed) return
    el.muted = true
    el.volume = 0
    void el.play().catch(() => {})
  }, [url, embed])

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    if (videoRef.current) videoRef.current.muted = next
  }

  return (
    <div className="hero-video-frame group relative h-full min-h-[260px] w-full overflow-hidden rounded-3xl sm:min-h-[300px] lg:min-h-[340px]">
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-brand-400/50 via-brand-600/30 to-violet-500/40 opacity-80 blur-sm transition duration-500 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative h-full min-h-[inherit] overflow-hidden rounded-3xl bg-slate-950 shadow-[0_24px_60px_-20px_rgba(2,132,199,0.45)] ring-1 ring-white/10">
        {embed ? (
          <iframe
            src={buildAutoplayEmbedUrl(url)}
            className="absolute inset-0 h-full w-full"
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={url}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full scale-105 object-cover transition duration-[2s] group-hover:scale-110"
          />
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/15"
          aria-hidden
        />

        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/50 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          {badgeLabel}
        </span>

        {!embed ? (
          <button
            type="button"
            onClick={toggleMute}
            className="absolute bottom-4 right-4 rounded-full border border-white/25 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-slate-950/90"
            aria-pressed={!muted}
          >
            {muted ? 'Tap for sound' : 'Mute'}
          </button>
        ) : (
          <p className="absolute bottom-4 right-4 max-w-[10rem] rounded-lg bg-slate-950/70 px-2 py-1 text-[10px] text-white/80 backdrop-blur-md">
            Use player controls for sound
          </p>
        )}
      </div>
    </div>
  )
}
