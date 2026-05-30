type CardCoverMediaProps = {
  src: string
  alt?: string
}

/**
 * Shows the full photo without awkward cropping: blurred fill + sharp contain.
 * Works well for interior shots and wide marketing assets we still allow through scoring.
 */
export function CardCoverMedia({ src, alt = '' }: CardCoverMediaProps) {
  return (
    <div className="relative aspect-[3/2] overflow-hidden bg-slate-200 dark:bg-slate-900">
      <img
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl brightness-[0.55] saturate-150"
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="relative z-[1] h-full w-full object-contain object-center p-2 transition duration-700 ease-out group-hover:scale-[1.03]"
      />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-slate-950/50 via-slate-950/5 to-slate-950/20" />
    </div>
  )
}
