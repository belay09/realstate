/** Hide seed/admin placeholder copy on public location pages. */
export function isAdminPlaceholderDescription(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    lower.includes('configure') && lower.includes('admin') ||
    lower.includes('update cards from admin') ||
    lower.includes('official ayat apartment location page')
  )
}

export function shouldShowSubtitle(subtitle: string | null, title: string): boolean {
  if (!subtitle?.trim()) return false
  return subtitle.trim().toLowerCase() !== title.trim().toLowerCase()
}
