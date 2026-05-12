import { PageCtaBand } from '../components/page/PageCtaBand'
import { PageHero } from '../components/page/PageHero'

const games = [
  { title: 'Lucky Spin', tag: 'Hot' },
  { title: 'Ace Royale', tag: 'New' },
  { title: 'Golden Reels', tag: 'Top' },
  { title: 'Diamond Draw', tag: 'Hot' },
  { title: 'Royal Flush Live', tag: 'Live' },
  { title: 'Turbo Wheel', tag: 'New' },
]

export default function Games() {
  return (
    <main className="overflow-x-hidden bg-[#0B1020]">
      <PageHero
        eyebrow="Titles"
        title="Popular games"
        description="Curated highlights from our lobby—new titles rotate in regularly."
      />

      <section className="border-b border-white/[0.06] px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            { t: 'Curated', d: 'Highlights tuned for RSFGaming players.' },
            { t: 'Fresh drops', d: 'New picks highlighted as the lobby updates.' },
            { t: 'Fair play', d: 'Always subject to platform rules & RTP.' },
          ].map((x) => (
            <div
              key={x.t}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5 text-center transition hover:border-white/[0.12] hover:bg-white/[0.04] sm:text-left"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-[#FFD54A]/90">
                {x.t}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-sm text-neutral-500">
            Join thousands of players enjoying our most popular titles.
          </p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <li key={g.title}>
                <article className="group rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent p-6 text-center transition hover:-translate-y-0.5 hover:border-[#FFD54A]/35 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                  <span className="text-xs font-bold uppercase tracking-wide text-[#FFD54A]/90">
                    {g.tag}
                  </span>
                  <p className="mt-4 text-lg font-semibold text-white">{g.title}</p>
                  <p className="mt-2 text-sm text-neutral-500">
                    Hook to your catalog API
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <PageCtaBand
        title="Ready to play?"
        description="Pick a platform first—bonuses and chat are one tap away."
        primary={{ to: '/platforms', label: 'Platforms' }}
        secondary={{ to: '/bonuses', label: 'Bonuses' }}
      />
    </main>
  )
}
