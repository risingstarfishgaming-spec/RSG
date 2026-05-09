import { Link } from 'react-router'
import { PageHero } from '../components/page/PageHero'

export default function Settings() {
  return (
    <main className="bg-[#0a0a0b]">
      <PageHero
        eyebrow="Account"
        title="Settings"
        description="Notifications, security, and app preferences will live here."
      />
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-6 sm:p-8">
          {/*
          <p>Placeholder — wire toggles…</p>
          */}
          <p className="text-sm leading-relaxed text-neutral-400">
            More account options will appear here soon.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex min-h-12 touch-manipulation items-center justify-center rounded-xl bg-[#FFD700] px-4 py-3 text-base font-bold text-neutral-950 hover:bg-[#f5cc00]"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  )
}
