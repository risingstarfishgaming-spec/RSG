import { Link } from 'react-router'
import { PageHero } from '../components/page/PageHero'

export default function Profile() {
  return (
    <main className="bg-[#0a0a0b]">
      <PageHero
        eyebrow="Account"
        title="Edit profile"
        description="Update your name, contact details, and preferences when account editing is connected to your API."
      />
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-6 sm:p-8">
          <p className="text-sm leading-relaxed text-neutral-400">
            Profile editing will go here—form fields and save actions once your
            backend endpoints are ready.
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
