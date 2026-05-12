/** Atmosphere for inner marketing + auth shells — cosmic arcade palette aligned with home hero. */
export function InnerPageHeroBg() {
  return (
    <div
      className="pointer-events-none absolute inset-0 isolate overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#050A30] via-[#1a0b38] to-[#2E0854]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0418]/95 via-[#1f0a32]/5 to-[#0d1a3a]/35" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_38%,rgba(139,0,139,0.16)_0%,rgba(46,8,84,0.1)_48%,transparent_74%)]" />

      <div className="animate-hero-cosmic-pulse absolute left-1/2 top-[36%] h-[min(100vmin,520px)] w-[min(100vmin,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.12)_0%,rgba(124,58,237,0.1)_38%,transparent_65%)] mix-blend-screen sm:top-[40%]" />

      <div className="animate-hero-spotlight absolute inset-x-0 top-0 h-[min(55vh,380px)] opacity-[0.1] mix-blend-soft-light sm:opacity-[0.14]">
        <div className="absolute left-1/2 top-0 h-full w-[130%] -translate-x-1/2 bg-[conic-gradient(from_270deg_at_50%_0%,transparent_0deg,rgba(56,189,248,0.28)_48deg,rgba(147,197,253,0.14)_90deg,transparent_135deg)]" />
      </div>

      <div
        className="animate-hero-aurora absolute left-1/2 top-1/2 h-[min(120vmin,560px)] w-[min(120vmin,560px)] opacity-[0.16] mix-blend-soft-light sm:h-[min(140vmin,640px)] sm:w-[min(140vmin,640px)] sm:opacity-[0.22]"
        style={{
          transform: 'translate(-50%, -50%)',
          background:
            'conic-gradient(from 200deg at 50% 50%, rgba(251,191,36,0.38) 0deg, rgba(167,139,250,0.42) 110deg, rgba(236,72,153,0.28) 220deg, rgba(56,189,248,0.38) 360deg)',
        }}
      />

      <div className="absolute inset-0 opacity-[0.3] mix-blend-overlay sm:opacity-[0.38]">
        <div
          className="animate-hero-caustics absolute -left-1/4 top-0 h-[110%] w-[65%] bg-gradient-to-br from-sky-200/18 via-transparent to-transparent sm:w-[50%]"
          style={{ transformOrigin: 'top left' }}
        />
        <div
          className="animate-hero-caustics absolute -right-1/4 bottom-0 h-[95%] w-[55%] bg-gradient-to-tl from-fuchsia-300/12 via-transparent to-transparent [animation-delay:-8s] sm:w-[42%]"
          style={{ transformOrigin: 'bottom right' }}
        />
      </div>

      <div className="absolute inset-0 opacity-[0.48] sm:opacity-[0.56]">
        <div className="animate-home-float absolute -left-10 top-[10%] h-[min(45vw,280px)] w-[min(45vw,280px)] rounded-full bg-violet-500/28 blur-[42px] sm:blur-[64px]" />
        <div className="animate-home-float-delayed absolute -right-8 bottom-[15%] h-[min(40vw,240px)] w-[min(40vw,240px)] rounded-full bg-fuchsia-500/26 blur-[48px] sm:blur-[72px]" />
        <div className="animate-home-float-slow absolute bottom-[8%] left-[18%] hidden h-[min(32vw,200px)] w-[min(32vw,200px)] rounded-full bg-[#D4AF37]/12 blur-[36px] sm:block" />
      </div>

      <div className="absolute inset-0">
        <div className="animate-hero-dust absolute left-[22%] top-[28%] h-1 w-1 rounded-full bg-[#FFD54A]/40 blur-[1.5px] shadow-[0_0_6px_rgba(255,213,74,0.35)]" />
        <div className="animate-hero-dust-delayed absolute right-[18%] top-[34%] h-1 w-1 rounded-full bg-amber-200/35 blur-[1.5px]" />
        <div className="animate-hero-dust-slow absolute left-[58%] top-[22%] hidden h-1 w-1 rounded-full bg-[#FFD54A]/32 blur-[1.5px] sm:block" />
        <div className="animate-hero-dust absolute bottom-[40%] right-[26%] h-1 w-1 rounded-full bg-[#f5d78e]/35 blur-[1.5px]" />
      </div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M60%200H0v60%22%20fill%3D%22none%22%20stroke%3D%22rgba(196%2C181%2C253%2C0.065)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-72" />
      <div
        className="absolute inset-0 opacity-[0.09] mix-blend-overlay sm:opacity-[0.12]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='iphb'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23iphb)' opacity='0.55'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/45 via-[#0a0418]/2 to-transparent" />
    </div>
  )
}
