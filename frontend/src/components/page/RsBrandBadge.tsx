import { StarAccent } from './StarAccent'

export function RsBrandBadge() {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/95 shadow-lg shadow-black/25 backdrop-blur-md sm:text-xs sm:tracking-[0.2em]">
      <StarAccent className="h-3 w-3 text-[#FFD54A] sm:h-3.5 sm:w-3.5" />
      RSFGaming
      <StarAccent className="h-3 w-3 text-[#FFD54A] sm:h-3.5 sm:w-3.5" />
    </div>
  )
}
