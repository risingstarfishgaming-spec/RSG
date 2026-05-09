import { Link } from 'react-router'
import { StarAccent } from '../components/page/StarAccent'
import { WaveToDark } from '../components/page/WaveToDark'
import { homePlatformsPlaceholder } from '../data/homePlatforms'
import { FacebookReviewsCarousel } from '../components/page/FacebookReviewsCarousel'

/** Creative hero-only atmosphere: aurora, depth blobs, underwater caustics, fish & stars. Mobile = lighter layers. */
function HeroBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 isolate overflow-hidden"
      aria-hidden
    >
      {/* Depth base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c1929] via-[#2a3f8f] to-[#2a1458]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#140822]/95 via-[#1a0a28]/50 to-[#0e4a6e]/35" />

      {/* Slow rotating aurora — smaller on phones to save GPU */}
      <div
        className="animate-hero-aurora absolute left-1/2 top-1/2 h-[min(150vmin,680px)] w-[min(150vmin,680px)] opacity-[0.22] mix-blend-soft-light sm:h-[min(190vmin,880px)] sm:w-[min(190vmin,880px)] sm:opacity-[0.32]"
        style={{
          transform: 'translate(-50%, -50%)',
          background:
            'conic-gradient(from 210deg at 50% 45%, rgba(56,189,248,0.55) 0deg, rgba(167,139,250,0.5) 95deg, rgba(251,191,36,0.4) 185deg, rgba(34,211,238,0.45) 275deg, rgba(56,189,248,0.55) 360deg)',
        }}
      />

      {/* Soft light beams (“caustics”) */}
      <div className="absolute inset-0 opacity-40 mix-blend-overlay sm:opacity-50">
        <div
          className="animate-hero-caustics absolute -left-1/4 top-0 h-[120%] w-[70%] bg-gradient-to-br from-white/25 via-transparent to-transparent sm:w-[55%]"
          style={{ transformOrigin: 'top left' }}
        />
        <div
          className="animate-hero-caustics absolute -right-1/4 bottom-0 h-[100%] w-[60%] bg-gradient-to-tl from-cyan-300/20 via-transparent to-transparent [animation-delay:-8s] sm:w-[45%]"
          style={{ transformOrigin: 'bottom right' }}
        />
      </div>

      {/* Floating color masses — tighter blur on small screens */}
      <div className="absolute inset-0 opacity-[0.55] sm:opacity-[0.65]">
        <div className="animate-home-float absolute -left-16 top-[6%] h-[min(52vw,380px)] w-[min(52vw,380px)] rounded-full bg-sky-300/45 blur-[48px] sm:-left-20 sm:h-[min(55vw,420px)] sm:w-[min(55vw,420px)] sm:blur-[80px]" />
        <div className="animate-home-float-delayed absolute -right-12 top-[26%] h-[min(46vw,340px)] w-[min(46vw,340px)] rounded-full bg-violet-400/40 blur-[52px] sm:-right-16 sm:top-[28%] sm:h-[min(48vw,380px)] sm:w-[min(48vw,380px)] sm:blur-[90px]" />
        <div className="animate-home-float-slow absolute bottom-[4%] left-[15%] hidden h-[min(38vw,280px)] w-[min(38vw,280px)] rounded-full bg-amber-200/30 blur-[44px] sm:bottom-[5%] sm:left-[20%] sm:block sm:h-[min(40vw,320px)] sm:w-[min(40vw,320px)] sm:blur-[70px]" />
        {/* Extra golden pocket — mobile only (single extra warmth) */}
        <div className="animate-home-float absolute -bottom-8 right-[10%] h-[min(42vw,260px)] w-[min(42vw,260px)] rounded-full bg-amber-400/25 blur-[40px] sm:hidden" />
      </div>

      {/* Fish school — single SVG, low contrast fish shapes */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.055] mix-blend-soft-light sm:opacity-[0.07]"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 400 300"
      >
        <defs>
          <path
            id="fish"
            d="M0 0c12-4 28-4 42 2 14 6 22 18 18 28-4 10-18 14-32 10l-8-3-18 14c-6 4-14 2-18-4-4-6-2-14 4-18l12-10c-8-6-12-16-8-25 4-10 14-14 24-12z"
            fill="currentColor"
            className="text-white"
          />
        </defs>
        <use href="#fish" transform="translate(60 80) scale(0.45) rotate(-8)" />
        <use href="#fish" transform="translate(220 140) scale(0.35) rotate(12)" />
        <use href="#fish" transform="translate(300 60) scale(0.28) rotate(-15)" />
        <use
          href="#fish"
          transform="translate(140 200) scale(0.32) rotate(5)"
          className="hidden sm:inline"
        />
        <use
          href="#fish"
          transform="translate(340 220) scale(0.22) rotate(-20)"
          className="hidden sm:inline"
        />
      </svg>

      {/* Twinkling stars — fewer on narrow viewports via hidden sm:block */}
      <div className="absolute inset-0 text-[#FFD700]">
        <StarAccent className="animate-hero-twinkle absolute left-[12%] top-[18%] h-2 w-2 opacity-60 sm:left-[10%] sm:top-[15%] sm:h-2.5 sm:w-2.5" />
        <StarAccent className="animate-hero-twinkle-delay absolute left-[78%] top-[22%] h-1.5 w-1.5 sm:left-[82%] sm:top-[18%] sm:h-2 sm:w-2" />
        <StarAccent className="animate-hero-twinkle-slow absolute bottom-[38%] left-[8%] h-2 w-2 sm:bottom-[35%]" />
        <StarAccent className="animate-hero-twinkle absolute right-[14%] top-[40%] hidden h-2 w-2 sm:block" />
        <StarAccent className="animate-hero-twinkle-delay absolute left-[45%] top-[12%] hidden h-1.5 w-1.5 sm:block" />
        <StarAccent className="animate-hero-twinkle-slow absolute bottom-[28%] right-[22%] h-1.5 w-1.5 sm:h-2 sm:w-2" />
      </div>

      {/* Fine grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M60%200H0v60%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.05)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-70" />

      {/* Film grain — improves depth without hurting readability */}
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay sm:opacity-[0.18]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Bottom vignette for wave handoff */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  )
}

export default function Home() {
  const platforms = homePlatformsPlaceholder

  return (
    <main className="bg-[#0a0a0b]">
      {/* —— Hero —— */}
      <section className="relative min-h-[min(88dvh,820px)] overflow-hidden sm:min-h-[min(92dvh,880px)]">
        <HeroBackground />

        <div className="relative z-10 mx-auto flex min-h-[min(88dvh,820px)] max-w-6xl flex-col items-center justify-center px-4 pb-28 pt-20 text-center sm:min-h-[min(92dvh,880px)] sm:px-6 sm:pb-32 sm:pt-28">
          <div className="animate-home-shimmer mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/95 shadow-lg shadow-black/20 backdrop-blur-md">
            <StarAccent className="h-3.5 w-3.5 text-[#FFD700]" />
            RSFGaming
            <StarAccent className="h-3.5 w-3.5 text-[#FFD700]" />
          </div>

          <h1 className="font-display max-w-4xl text-[clamp(2.5rem,8vw,4.75rem)] font-normal leading-[1.05] tracking-tight">
            <span className="text-gold-gradient drop-shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
              Rising Star Fish Gaming
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
            Platforms, bonuses, and live support—times in{' '}
            <span className="font-semibold text-white">CST</span>.
          </p>

          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            <Link
              to="/platforms"
              className="inline-flex items-center justify-center rounded-full bg-[#FFD700] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-neutral-950 shadow-[0_8px_32px_rgba(255,215,0,0.35)] transition hover:bg-[#ffe44d] hover:shadow-[0_12px_40px_rgba(255,215,0,0.45)]"
            >
              Platforms
            </Link>
            <Link
              to="/bonuses"
              className="inline-flex items-center justify-center rounded-full border-2 border-white/40 bg-white/5 px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/10"
            >
              Bonuses
            </Link>
          </div>

          <a
            href="#platforms"
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/50 transition hover:text-white/80"
            aria-label="Scroll to platforms"
          >
            <span className="text-[10px] uppercase tracking-widest">Scroll</span>
            <span className="inline-block animate-bounce text-lg leading-none">
              ↓
            </span>
          </a>
        </div>

        <WaveToDark className="h-12 sm:h-16" />
      </section>

      {/* —— Platforms —— */}
      <section
        id="platforms"
        className="scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-3xl font-normal text-white sm:text-4xl md:text-5xl">
              Platforms
            </h2>
            <p className="mt-3 text-sm text-neutral-500">
              Highlights below—the full catalog is on the platforms page.
            </p>
          </div>

          {platforms.length === 0 ? (
            <div className="mt-14">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-transparent p-6 transition hover:border-[#FFD700]/30"
                  >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#FFD700]/10 blur-2xl transition group-hover:bg-[#FFD700]/20" />
                    <div className="relative">
                      <div className="h-2 w-12 rounded-full bg-[#FFD700]/40" />
                      <div className="mt-4 h-4 w-3/4 max-w-[200px] rounded bg-white/10" />
                      <div className="mt-3 h-3 w-full rounded bg-white/[0.06]" />
                      <div className="mt-2 h-3 w-5/6 rounded bg-white/[0.04]" />
                      <p className="mt-6 text-xs font-medium text-neutral-500">
                        {i === 0 ? 'Coming soon' : i === 1 ? 'More soon' : 'More soon'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-5 text-center">
                <p className="text-sm text-neutral-400">
                  Nothing published yet—check back soon.
                </p>
                <Link
                  to="/platforms"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#FFD700] transition hover:gap-3"
                >
                  All platforms
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {platforms.map((p) => (
                <li key={p.id}>
                  <article className="group h-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent p-6 transition hover:-translate-y-0.5 hover:border-[#FFD700]/35 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                    <StarAccent className="h-5 w-5 text-[#FFD700]/80 transition group-hover:text-[#FFD700]" />
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      {p.name}
                    </h3>
                    {p.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                        {p.description}
                      </p>
                    ) : null}
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* —— Hours —— */}
      <section className="border-y border-white/[0.06] bg-[#080809] px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-2xl font-normal text-white sm:text-3xl">
            Hours <span className="text-neutral-500">·</span> CST
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-neutral-400">
            Open around the clock except{' '}
            <span className="font-semibold text-[#FFD700]">12:00 PM – 6:00 PM CST</span>{' '}
            daily. No play or support during that window.
          </p>
        </div>
      </section>

      <FacebookReviewsCarousel />

      {/* —— Final CTA —— */}
      <section className="px-4 pb-20 pt-2 sm:px-6 sm:pb-28">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#FFD700]/25 bg-gradient-to-r from-[#1a1408] via-[#2d1f0a] to-[#1a1408] px-8 py-12 text-center shadow-[0_0_80px_rgba(255,215,0,0.12)] sm:py-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            aria-hidden
          >
            <div className="absolute left-1/4 top-0 h-40 w-40 rounded-full bg-[#FFD700] blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-amber-600 blur-[80px]" />
          </div>
          <h2 className="font-display relative text-xl font-normal text-white sm:text-2xl md:text-3xl">
            Get started
          </h2>
          <p className="relative mx-auto mt-2 max-w-sm text-sm text-amber-100/70">
            Chat live or open support anytime we’re open.
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/chat"
              className="inline-flex rounded-full bg-[#FFD700] px-7 py-3 text-sm font-bold text-neutral-950 transition hover:bg-[#ffe566]"
            >
              Chat
            </Link>
            <Link
              to="/support"
              className="inline-flex rounded-full border border-white/25 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
