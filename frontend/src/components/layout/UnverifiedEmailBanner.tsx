import { Link } from 'react-router'
import type { AuthUser } from '../../types/auth'

/**
 * Persistent banner shown when a signed-in user hasn't verified their email yet.
 * Deep-links to /verify-email with the user's address prefilled.
 */
export function UnverifiedEmailBanner({ user }: { user: AuthUser }) {
  if (user.isEmailVerified) return null

  const target = `/verify-email?email=${encodeURIComponent(user.email)}`

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-amber-500/40 bg-amber-500/10 text-amber-100"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-3 py-2 text-center text-xs sm:px-6 sm:text-sm">
        <span className="font-medium">
          Your email isn&apos;t verified yet.
        </span>
        <span className="text-amber-200/85">
          Verify it to unlock bonuses and keep your account secure.
        </span>
        <Link
          to={target}
          className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-50 underline-offset-2 transition hover:bg-amber-500/30 hover:underline"
        >
          Verify email
        </Link>
      </div>
    </div>
  )
}
