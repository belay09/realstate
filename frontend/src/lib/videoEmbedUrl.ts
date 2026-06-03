/** YouTube/Vimeo embed URLs with autoplay + muted (browser policy). */
export function buildAutoplayEmbedUrl(url: string): string {
  const trimmed = url.trim()

  const watchMatch = trimmed.match(
    /(?:youtube\.com\/watch\?[^#]*v=|youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i,
  )
  if (watchMatch) {
    const id = watchMatch[1]
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&playsinline=1&controls=1&rel=0&modestbranding=1`
  }

  if (/youtube\.com\/embed\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed)
      u.searchParams.set('autoplay', '1')
      u.searchParams.set('mute', '1')
      u.searchParams.set('loop', '1')
      u.searchParams.set('playsinline', '1')
      u.searchParams.set('controls', '1')
      u.searchParams.set('rel', '0')
      u.searchParams.set('modestbranding', '1')
      const id = u.pathname.split('/').filter(Boolean).pop()
      if (id) u.searchParams.set('playlist', id)
      return u.toString()
    } catch {
      return trimmed
    }
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  if (vimeoMatch) {
    const id = vimeoMatch[1]
    return `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&background=0`
  }

  if (/player\.vimeo\.com\/video\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed)
      u.searchParams.set('autoplay', '1')
      u.searchParams.set('muted', '1')
      u.searchParams.set('loop', '1')
      return u.toString()
    } catch {
      return trimmed
    }
  }

  return trimmed
}

export function isEmbedVideoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com/i.test(url)
}
