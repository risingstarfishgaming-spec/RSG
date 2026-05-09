type WaveProps = { className?: string }

/** Default height for inner pages; pass extra classes e.g. `h-12 sm:h-16` to override height for home. */
export function WaveToDark({ className }: WaveProps) {
  return (
    <div
      className={`relative -mt-px w-full text-[#0a0a0b] ${className ?? 'h-10 sm:h-14'}`}
      aria-hidden
    >
      <svg
        className="absolute bottom-0 block h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 1440 56"
        fill="currentColor"
      >
        <path d="M0 32C240 8 480 56 720 32s480-24 720 0v24H0V32z" />
      </svg>
    </div>
  )
}
