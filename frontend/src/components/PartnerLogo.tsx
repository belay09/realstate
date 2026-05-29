import * as React from 'react'

import { AYAT_PARTNER, partnerForSlug } from '../content/partners'

type PartnerLogoProps = {
  companySlug?: string | null
  companyName?: string
  logoUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  className?: string
}

const SIZE_CLASS = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-28 w-28 sm:h-32 sm:w-32',
  xl: 'h-20 w-20 sm:h-24 sm:w-24',
  hero: 'h-24 w-24 sm:h-28 sm:w-28',
} as const

export function PartnerLogo({
  companySlug,
  companyName,
  logoUrl,
  size = 'md',
  className = '',
}: PartnerLogoProps) {
  const partner = partnerForSlug(companySlug)
  const src = logoUrl ?? partner?.logoUrl
  const name = companyName ?? partner?.brandName ?? 'Developer'
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    setFailed(false)
  }, [src])

  const isAyat = companySlug === AYAT_PARTNER.slug
  const shapeClass = isAyat ? 'rounded-full' : 'rounded-xl'
  const boxClass = `${SIZE_CLASS[size]} shrink-0 ${shapeClass} border border-border bg-surface object-contain p-1 shadow-sm ${className}`

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        className={boxClass}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span
      className={`flex ${SIZE_CLASS[size]} shrink-0 items-center justify-center rounded-xl border border-border bg-brand-700 text-sm font-bold text-white shadow-sm ${className}`}
      aria-hidden
    >
      {name.charAt(0)}
    </span>
  )
}
