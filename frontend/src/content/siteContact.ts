/** Belay Properties contact — shown site-wide. */
export const SITE_CONTACT = {
  phoneDisplay: '0962750710',
  phoneE164: '251962750710',
  telHref: 'tel:+251962750710',
} as const

export function siteWhatsAppE164(): string {
  const fromEnv = import.meta.env.VITE_WHATSAPP_E164?.replace(/\D/g, '')
  return fromEnv || SITE_CONTACT.phoneE164
}

export function siteWhatsAppHref(message?: string): string {
  const digits = siteWhatsAppE164()
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
