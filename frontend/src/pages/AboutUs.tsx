import { Link } from 'react-router'
import { PageHero } from '../components/page/PageHero'

export default function AboutUs() {
  return (
    <main className="bg-[#0a0a0b]">
      <PageHero
        eyebrow="Rising Star Fish Gaming"
        title="About us"
        description="One home for trusted platforms, honest promotions, and support that respects your time—all anchored in Central Standard Time."
      />

      <section className="border-b border-white/[0.06] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
            <h2 className="font-display text-xl font-normal text-white sm:text-2xl">
              Why we exist
            </h2>
            <p className="mt-4 leading-relaxed text-neutral-400">
              RSFGaming exists so players have a single, trustworthy place to
              discover platforms, understand promotions, and get real help—without
              wading through noise.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
            <h2 className="font-display text-xl font-normal text-white sm:text-2xl">
              Our approach
            </h2>
            <p className="mt-4 leading-relaxed text-neutral-400">
              We focus on clarity: straightforward listings, honest descriptions
              of offers, and responsive support when something doesn&apos;t go as
              expected.
            </p>
          </div>

          <div className="rounded-2xl border border-[#FFD700]/20 bg-gradient-to-br from-[#FFD700]/[0.06] to-transparent p-6 sm:p-8">
            <h2 className="font-display text-xl font-normal text-white sm:text-2xl">
              Contact & partnerships
            </h2>
            <p className="mt-4 leading-relaxed text-neutral-400">
              For partnerships, press, or general inquiries, reach out through{' '}
              <Link
                to="/support"
                className="font-semibold text-[#FFD700] underline-offset-4 hover:underline"
              >
                Support
              </Link>
              —we&apos;ll route your message to the right team.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
