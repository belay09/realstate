import type { PartnerSlug } from '../content/partners'
import { PARTNER_SLUGS, partnerForSlug } from '../content/partners'

export function developerKindPath(slug: string): string {
  return `/developers/${slug}`
}

export function developerResidentialPath(slug: string): string {
  return `/apartments?company_slug=${encodeURIComponent(slug)}`
}

export function developerShopsPath(slug: string): string {
  return `/shops?company_slug=${encodeURIComponent(slug)}`
}

export function resolvePartnerSlugParam(param: string | undefined): PartnerSlug | null {
  if (!param) return null
  const decoded = decodeURIComponent(param)
  if ((PARTNER_SLUGS as readonly string[]).includes(decoded)) {
    return decoded as PartnerSlug
  }
  return partnerForSlug(decoded)?.slug ?? null
}
