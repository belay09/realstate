import { Link } from 'react-router-dom'

import type { PartnerSlug } from '../content/partners'
import { partnerForSlug } from '../content/partners'
import { PartnerLogo } from './PartnerLogo'

type DeveloperBrowseCardProps = {
  partnerSlug: PartnerSlug
  title: string
  description: string
  tag: string
  image: string
  to: string
  ctaLabel: string
  secondaryTo?: string
  secondaryLabel?: string
}

export function DeveloperBrowseCard({
  partnerSlug,
  title,
  description,
  tag,
  image,
  to,
  ctaLabel,
  secondaryTo,
  secondaryLabel,
}: DeveloperBrowseCardProps) {
  const partner = partnerForSlug(partnerSlug)

  return (
    <article className="surface-luxury group flex h-full flex-col">
      <Link to={to} className="relative block aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
        <span className="badge-sale absolute left-5 top-5">{tag}</span>
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <PartnerLogo companySlug={partnerSlug} size="sm" className="border-white/20 bg-white/95" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                {partner?.brandName}
              </p>
              <p className="truncate text-xl font-bold text-white sm:text-2xl">{title}</p>
            </div>
          </div>
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 transition group-hover:bg-brand-500 group-hover:text-white"
            aria-hidden
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-7 sm:p-8">
        <p className="text-body-sm leading-relaxed">{description}</p>
        <Link
          to={to}
          className="btn-luxury mt-6 w-fit py-1.5 pl-5 pr-1.5 text-xs normal-case tracking-normal"
        >
          <span>{ctaLabel}</span>
          <span className="btn-luxury-icon h-8 w-8">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </Link>
        {secondaryTo && secondaryLabel ? (
          <p className="mt-4 text-xs text-fg-muted">
            {secondaryLabel}{' '}
            <Link to={secondaryTo} className="font-semibold text-brand-700 underline dark:text-brand-300">
              →
            </Link>
          </p>
        ) : null}
      </div>
    </article>
  )
}
