/** Atmosphere for inner marketing pages — matches home/bonuses language, mobile-friendly. */
export function InnerPageHeroBg() {
  return (
    <div
      className="pointer-events-none absolute inset-0 isolate overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f2744] via-[#363fa3] to-[#351858]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#120820]/90 via-transparent to-[#0e4a6e]/25" />
      <div
        className="animate-hero-aurora absolute left-1/2 top-1/2 h-[min(120vmin,560px)] w-[min(120vmin,560px)] opacity-[0.18] mix-blend-soft-light sm:h-[min(140vmin,640px)] sm:w-[min(140vmin,640px)] sm:opacity-[0.26]"
        style={{
          transform: 'translate(-50%, -50%)',
          background:
            'conic-gradient(from 200deg at 50% 50%, rgba(56,189,248,0.5) 0deg, rgba(167,139,250,0.45) 110deg, rgba(251,191,36,0.35) 220deg, rgba(56,189,248,0.5) 360deg)',
        }}
      />
      <div className="absolute inset-0 opacity-50">
        <div className="animate-home-float absolute -left-10 top-[10%] h-[min(45vw,280px)] w-[min(45vw,280px)] rounded-full bg-sky-300/35 blur-[42px] sm:blur-[64px]" />
        <div className="animate-home-float-delayed absolute -right-8 bottom-[15%] h-[min(40vw,240px)] w-[min(40vw,240px)] rounded-full bg-violet-400/30 blur-[48px] sm:blur-[72px]" />
      </div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M60%200H0v60%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.05)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-75" />
      <div
        className="absolute inset-0 opacity-[0.1] mix-blend-overlay sm:opacity-[0.14]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='iphb'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23iphb)' opacity='0.55'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  )
}
