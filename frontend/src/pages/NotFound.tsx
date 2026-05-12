import { Link } from 'react-router'
import { PageCtaBand } from '../components/page/PageCtaBand'
import { PageHero } from '../components/page/PageHero'

export default function NotFound() {
  return (
    <main className="bg-[#0B1020]">
      <PageHero
        showBadge={false}
        eyebrow="Lost at sea"
        title={
          <span className="font-display text-gold-gradient text-[clamp(3.5rem,18vw,7rem)] leading-none drop-shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
            404
          </span>
        }
        description={
          <>
            <span className="mt-6 block font-display text-xl font-normal text-white sm:text-2xl">
              Page not found
            </span>
            <span className="mt-3 block text-neutral-400">
              That link may be old, or the page moved—let’s get you back on course.
            </span>
          </>
        }
      />

      <section className="px-4 py-12 text-center sm:px-6 sm:py-16">
        <Link
          to="/"
          className="inline-flex rounded-full border border-[#FFD54A]/40 bg-[#FFD54A]/10 px-8 py-3 text-sm font-semibold text-[#FFD54A] transition hover:bg-[#FFD54A]/20"
        >
          Back to home
        </Link>
      </section>

      <PageCtaBand
        title="Try these instead"
        description="Platforms, bonuses, and chat are always a tap away."
        primary={{ to: '/platforms', label: 'Platforms' }}
        secondary={{ to: '/bonuses', label: 'Bonuses' }}
      />
    </main>
  )
}
