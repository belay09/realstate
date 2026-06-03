import type { CSSProperties, ElementType, ReactNode } from 'react'

import { useRevealOnScroll } from '../hooks/useRevealOnScroll'

type Animation = 'up' | 'scale' | 'fade' | 'slide-right'

type ScrollRevealProps = {
  children: ReactNode
  as?: ElementType
  className?: string
  animation?: Animation
  delayMs?: number
  id?: string
}

const ANIMATION_CLASS: Record<Animation, string> = {
  up: 'animate-reveal-up',
  scale: 'animate-reveal-scale',
  fade: 'animate-reveal-fade',
  'slide-right': 'animate-reveal-slide-right',
}

export function ScrollReveal({
  children,
  as: Tag = 'div',
  className = '',
  animation = 'up',
  delayMs = 0,
  id,
}: ScrollRevealProps) {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>()
  const animClass = ANIMATION_CLASS[animation]
  const style = { animationDelay: `${delayMs}ms` } satisfies CSSProperties

  const mergedClass = [className, visible ? animClass : 'reveal-pending'].filter(Boolean).join(' ')

  return (
    <Tag id={id} ref={ref as never} className={mergedClass} style={visible ? style : undefined}>
      {children}
    </Tag>
  )
}
