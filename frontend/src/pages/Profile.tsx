import { useState } from 'react'
import { Link } from 'react-router'
import toast from 'react-hot-toast'
import { PageHero } from '../components/page/PageHero'
import { useAuthStore } from '../stores/authStore'
import type { AuthUser } from '../types/auth'

function VerificationPill({ user }: { user: AuthUser }) {
  if (user.isEmailVerified) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
        Email verified
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
      Email not verified
    </span>
  )
}

type ActionCard = {
  href: string
  eyebrow: string
  title: string
  description: string
  cta: string
}

function NextActionCard({ card }: { card: ActionCard }) {
  return (
    <Link
      to={card.href}
      className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-5 transition hover:-translate-y-0.5 hover:border-[#FFD54A]/45 hover:bg-white/[0.06] hover:shadow-[0_16px_40px_rgba(0,0,0,0.3),0_0_20px_rgba(255,213,74,0.04)] sm:p-6"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFD54A]/85">
          {card.eyebrow}
        </p>
        <h3 className="mt-2 text-base font-semibold text-white sm:text-lg">
          {card.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
          {card.description}
        </p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#FFD54A] transition group-hover:translate-x-0.5">
        {card.cta}
        <span aria-hidden>→</span>
      </span>
    </Link>
  )
}

export default function Profile() {
  const user = useAuthStore((s) => s.user)
  const [copied, setCopied] = useState(false)

  if (!user) {
    return null
  }

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(user.referralCode)
      setCopied(true)
      toast.success('Referral code copied')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy code')
    }
  }

  const cards: ActionCard[] = [
    {
      href: '/bonuses',
      eyebrow: 'Earn rewards',
      title: 'Claim a bonus',
      description:
        'Browse active welcome and reload bonuses tailored to your account.',
      cta: 'See bonuses',
    },
    {
      href: '/support',
      eyebrow: 'Need a hand?',
      title: 'Chat with support',
      description:
        'Our team is online to help you fund, withdraw, or troubleshoot anything.',
      cta: 'Open support',
    },
    {
      href: '/bonuses',
      eyebrow: 'Invite friends',
      title: 'Share your code',
      description: `Give friends a head start with your referral code. You both get rewards when they join.`,
      cta: 'Manage referrals',
    },
  ]

  return (
    <main className="bg-[#0B1020]">
      <PageHero
        eyebrow="Your account"
        title={`Welcome, ${user.firstName || 'player'}`}
        description="Manage your profile and pick up where you left off."
      />

      <section className="px-4 pb-12 pt-2 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Signed in as
                </p>
                <p className="mt-1 truncate text-lg font-semibold text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="mt-0.5 truncate text-sm text-neutral-400">
                  {user.email}
                </p>
              </div>
              <VerificationPill user={user} />
            </div>

            {!user.isEmailVerified ? (
              <div className="mt-5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-3 text-sm leading-relaxed text-amber-100">
                <p className="font-semibold">Verify your email to unlock everything.</p>
                <p className="mt-1 text-amber-200/85">
                  We sent a 6-digit code to {user.email}.
                </p>
                <Link
                  to={`/verify-email?email=${encodeURIComponent(user.email)}`}
                  className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-neutral-950 transition hover:bg-amber-300"
                >
                  Verify email
                </Link>
              </div>
            ) : null}

            <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Phone
                </dt>
                <dd className="mt-1 text-sm text-neutral-200">
                  {user.phoneNumber ? user.phoneNumber : (
                    <span className="text-neutral-500">Not added yet</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Referral code
                </dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-sm font-mono text-[#FFD54A]">
                    {user.referralCode}
                  </code>
                  <button
                    type="button"
                    onClick={copyReferral}
                    className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-neutral-200 transition hover:border-[#FFD54A]/40 hover:text-[#FFD54A]"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to="/settings"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-neutral-200 transition hover:border-[#FFD54A]/40 hover:text-[#FFD54A]"
              >
                Account settings
              </Link>
              <Link
                to="/support"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-neutral-200 transition hover:border-[#FFD54A]/40 hover:text-[#FFD54A]"
              >
                Contact support
              </Link>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Pick up where you left off
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <NextActionCard key={c.title} card={c} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
