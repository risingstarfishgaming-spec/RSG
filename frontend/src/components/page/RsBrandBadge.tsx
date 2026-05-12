import { StarAccent } from './StarAccent'

export function RsBrandBadge() {
  return (
    <div className="hero-badge-cosmic mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.22em] text-white/95 shadow-lg shadow-black/25 backdrop-blur-md sm:text-xs sm:tracking-[0.2em]">
      <StarAccent className="h-3 w-3 text-[#FFD54A] drop-shadow-[0_0_8px_rgba(255,213,74,0.4)] sm:h-3.5 sm:w-3.5" />
      RSFGaming
      <StarAccent className="h-3 w-3 text-[#FFD54A] drop-shadow-[0_0_8px_rgba(255,213,74,0.4)] sm:h-3.5 sm:w-3.5" />
    </div>
  )
}
