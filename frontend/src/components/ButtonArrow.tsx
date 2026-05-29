import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonArrowProps = {
  to: string
  children: ReactNode
  variant?: 'dark' | 'light' | 'outline'
  className?: string
}

const VARIANT_CLASS = {
  dark: 'btn-luxury',
  light: 'btn-luxury-light',
  outline: 'btn-luxury-outline',
} as const

export function ButtonArrow({ to, children, variant = 'dark', className = '' }: ButtonArrowProps) {
  return (
    <Link to={to} className={`${VARIANT_CLASS[variant]} ${className}`.trim()}>
      <span>{children}</span>
      <span className="btn-luxury-icon" aria-hidden>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </span>
    </Link>
  )
}

type ButtonArrowExternalProps = Omit<ButtonArrowProps, 'to'> & {
  href: string
}

export function ButtonArrowExternal({
  href,
  children,
  variant = 'dark',
  className = '',
}: ButtonArrowExternalProps) {
  return (
    <a
      href={href}
      className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{children}</span>
      <span className="btn-luxury-icon" aria-hidden>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </span>
    </a>
  )
}
