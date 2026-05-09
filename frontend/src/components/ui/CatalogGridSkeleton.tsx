type Props = {
  count?: number
  className?: string
}

/** Pulse placeholders matching public CMS card grids */
export function CatalogGridSkeleton({ count = 6, className = '' }: Props) {
  return (
    <ul
      className={`mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: count }, (_, i) => (
        <li
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]"
        >
          <div className="aspect-[16/9] bg-white/5" />
          <div className="space-y-3 p-6">
            <div className="h-5 w-24 rounded bg-white/10" />
            <div className="h-6 max-w-[14rem] rounded bg-white/10" />
            <div className="h-3 w-full rounded bg-white/5" />
            <div className="h-3 max-w-[95%] rounded bg-white/5" />
            <div className="h-10 w-full rounded-xl bg-white/5" />
          </div>
        </li>
      ))}
    </ul>
  )
}
