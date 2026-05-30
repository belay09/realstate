/** Prefer interior photos over Temer marketing flyer graphics for card thumbnails. */

const DIM_SUFFIX = /-\d+x\d+\.(jpe?g|png|webp)$/i
const TEMPLATE_MARKETING = /\/t-[a-z0-9_-]+\.(jpe?g|png|webp)$/i
const NUMBERED_INTERIOR = /\/\d{4}\/\d{2}\/\d+(?:-\d+)?\.(jpe?g|png|webp)$/i

export const MIN_CARD_IMAGE_SCORE = 10

const INTERIOR_HINTS = ['livingroom', 'kitchen', 'bedroom', 'interior', 'modern', 'hall', 'dining']

export function scoreCardImageUrl(url: string): number {
  const u = url.toLowerCase()
  let score = 0
  if (u.includes('-min') || u.includes('min.jpg')) score -= 25
  if (u.includes('logo') || u.includes('banner')) score -= 20
  if (u.includes('ayat-lomiyad') || u.includes('lomiyad')) score -= 15
  if (u.includes('/photo_')) score -= 10
  if (TEMPLATE_MARKETING.test(u) || u.includes('cenetr') || u.includes('t-cenetr')) score -= 24
  if (u.includes('-ads') || u.includes('goldmall')) score -= 14
  if (/\/0\d{3}[-_]/.test(u)) score -= 10
  if (INTERIOR_HINTS.some((hint) => u.includes(hint))) score += 24
  if (NUMBERED_INTERIOR.test(u)) score += 18
  if (u.includes('-1280x') || u.includes('-1920x')) score += 4
  if (DIM_SUFFIX.test(u) && !u.includes('-1280')) score -= 4
  return score
}

export function isCardImageUsable(url: string | null | undefined): boolean {
  if (!url?.trim()) return false
  return scoreCardImageUrl(url) >= MIN_CARD_IMAGE_SCORE
}

export function pickBestCardImageUrl(urls: Array<string | null | undefined>): string | null {
  const candidates = urls.filter((u): u is string => Boolean(u?.trim()))
  if (candidates.length === 0) return null
  const best = candidates.reduce((a, b) => (scoreCardImageUrl(a) > scoreCardImageUrl(b) ? a : b))
  return isCardImageUsable(best) ? best : null
}
