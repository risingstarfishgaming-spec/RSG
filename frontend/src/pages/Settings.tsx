import { Link, useNavigate } from 'react-router'
import { PageHero } from '../components/page/PageHero'
import { useAuthStore } from '../stores/authStore'

type Row = {
  label: string
  description: string
  action: { kind: 'link'; href: string; text: string } | { kind: 'soon' }
}

function SettingsRow({ row }: { row: Row }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4 last:border-b-0 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{row.label}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-neutral-400">
          {row.description}
        </p>
      </div>
      {row.action.kind === 'link' ? (
        <Link
          to={row.action.href}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-neutral-100 transition hover:border-[#FFD54A]/40 hover:text-[#FFD54A]"
        >
          {row.action.text}
        </Link>
      ) : (
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          Coming soon
        </span>
      )}
    </div>
  )
}

export default function Settings() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  if (!user) return null

  const accountRows: Row[] = [
    {
      label: 'Email address',
      description: user.email,
      action: user.isEmailVerified
        ? { kind: 'soon' }
        : {
            kind: 'link',
            href: `/verify-email?email=${encodeURIComponent(user.email)}`,
            text: 'Verify email',
          },
    },
    {
      label: 'Profile',
      description: 'Update your name, contact details, and preferences.',
      action: { kind: 'link', href: '/profile', text: 'Edit profile' },
    },
    {
      label: 'Phone number',
      description: user.phoneNumber
        ? user.phoneNumber
        : 'Add a phone number to speed up payouts and support.',
      action: { kind: 'soon' },
    },
  ]

  const securityRows: Row[] = [
    {
      label: 'Password',
      description:
        'Use the forgot-password flow if you need to change your password.',
      action: { kind: 'link', href: '/forgot-password', text: 'Reset password' },
    },
    {
      label: 'Two-factor authentication',
      description:
        'Add an extra layer of security with an authenticator app.',
      action: { kind: 'soon' },
    },
    {
      label: 'Active sessions',
      description:
        'See where you are signed in and sign out remotely.',
      action: { kind: 'soon' },
    },
  ]

  const supportRows: Row[] = [
    {
      label: 'Get help',
      description: 'Chat with our team or browse the support page.',
      action: { kind: 'link', href: '/support', text: 'Open support' },
    },
    {
      label: 'Privacy & terms',
      description: 'Read our privacy policy and terms of service.',
      action: { kind: 'link', href: '/privacy', text: 'Privacy' },
    },
  ]

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  return (
    <main className="bg-[#0B1020]">
      <PageHero
        eyebrow="Account"
        title="Settings"
        description="Manage how you sign in, how we keep you safe, and what we can help you with."
      />

      <section className="px-4 pb-12 pt-2 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent transition hover:border-white/[0.12]">
            <div className="border-b border-white/[0.06] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 sm:px-6">
              Account
            </div>
            {accountRows.map((r) => (
              <SettingsRow key={r.label} row={r} />
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent transition hover:border-white/[0.12]">
            <div className="border-b border-white/[0.06] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 sm:px-6">
              Security
            </div>
            {securityRows.map((r) => (
              <SettingsRow key={r.label} row={r} />
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent transition hover:border-white/[0.12]">
            <div className="border-b border-white/[0.06] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 sm:px-6">
              Support & legal
            </div>
            {supportRows.map((r) => (
              <SettingsRow key={r.label} row={r} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/25 bg-red-500/[0.06] px-5 py-4 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-200">Sign out</p>
              <p className="mt-0.5 text-sm leading-relaxed text-red-300/80">
                Sign out of this device. You can sign back in any time.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200 transition hover:border-red-400/60 hover:bg-red-500/25 hover:text-red-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
