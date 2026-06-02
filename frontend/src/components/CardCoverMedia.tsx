type CardCoverMediaProps = {
  src: string
  alt?: string
}

/** Full-bleed card thumbnail — standard real-estate crop. */
export function CardCoverMedia({ src, alt = '' }: CardCoverMediaProps) {
  return (
    <div className="relative aspect-[3/2] overflow-hidden bg-slate-200 dark:bg-slate-900">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover object-center transition duration-700 ease-out group-hover:scale-[1.03]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/15" />
    </div>
  )
}
