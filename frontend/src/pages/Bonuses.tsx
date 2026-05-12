import { useCallback, useEffect, useState } from 'react'
import { PageHero } from '../components/page/PageHero'
import { CatalogGridSkeleton } from '../components/ui/CatalogGridSkeleton'
import { fetchMe } from '../services/authApi'
import {
  claimBonus,
  fetchPublicBonuses,
  type PublicBonus,
} from '../services/cmsPublicApi'
import { useAuthStore } from '../stores/authStore'
import { formatEnumLabel } from '../utils/formatLabel'

function bonusStatusLabel(b: PublicBonus): 'Active' | 'Scheduled' | 'Ended' {
  const now = Date.now()
  if (b.validUntil && new Date(b.validUntil).getTime() < now) return 'Ended'
  if (b.validFrom && new Date(b.validFrom).getTime() > now) return 'Scheduled'
  return 'Active'
}

export default function Bonuses() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [referralLoading, setReferralLoading] = useState(false)
  const [copyDone, setCopyDone] = useState(false)
  const [bonuses, setBonuses] = useState<PublicBonus[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [catalogRetryKey, setCatalogRetryKey] = useState(0)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!token) return
    setReferralLoading(true)
    try {
      const { user: next } = await fetchMe(token)
      setUser(next)
    } catch {
      /* keep cached user */
    } finally {
      setReferralLoading(false)
    }
  }, [token, setUser])

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  useEffect(() => {
    let cancelled = false
    setCatalogLoading(true)
    ;(async () => {
      try {
        const data = await fetchPublicBonuses()
        if (!cancelled) {
          setBonuses(data)
          setCatalogError(null)
        }
      } catch {
        if (!cancelled) {
          setCatalogError('Could not load promotions.')
          setBonuses([])
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [catalogRetryKey])

  const copyCode = () => {
    const code = user?.referralCode?.trim()
    if (!code || !navigator.clipboard) return
    void navigator.clipboard.writeText(code).then(() => {
      setCopyDone(true)
      window.setTimeout(() => setCopyDone(false), 2000)
    })
  }

  return (
    <main className="bg-[#0B1020]">
      <PageHero
        eyebrow="Promotions"
        title="Bonuses"
        description="Stack value on every visit—welcome packs, reloads, and loyalty rewards from your live catalog."
      />

      {user && token ? (
        <section className="border-b border-white/[0.06] px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-2xl border border-[#FFD54A]/25 bg-gradient-to-br from-[#FFD54A]/12 via-white/[0.04] to-transparent p-6 sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,213,74,0.12),transparent_55%)]" />
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFD54A]">
                  Your referral code
                </p>
                <p className="mt-2 max-w-xl text-sm text-neutral-400">
                  Share this code with friends. They can enter it when they sign
                  up. {referralLoading ? 'Refreshing…' : null}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code className="min-h-[3rem] rounded-xl border border-white/10 bg-black/50 px-4 py-3 font-mono text-lg font-semibold tracking-wider text-[#FFD54A] sm:text-xl">
                    {user.referralCode?.trim()
                      ? user.referralCode
                      : '—'}
                  </code>
                  <button
                    type="button"
                    onClick={copyCode}
                    disabled={!user.referralCode?.trim()}
                    className="rounded-full border border-[#FFD54A]/40 bg-[#FFD54A]/10 px-5 py-2.5 text-sm font-semibold text-[#FFD54A] transition hover:bg-[#FFD54A]/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {copyDone ? 'Copied' : 'Copy code'}
                  </button>
                </div>
                {!user.referralCode?.trim() ? (
                  <p className="mt-3 text-xs text-neutral-500">
                    Your code will show here once your profile is synced. Pull
                    to refresh or revisit this page.
                  </p>
                ) : null}
                {!user.isEmailVerified ? (
                  <p className="mt-4 text-xs text-amber-400/90">
                    Verify your email to unlock full account access, including
                    sign-in on new devices.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FFD54A]">
              Live & upcoming
            </p>
            <h2 className="font-display mt-2 text-2xl font-semibold text-white sm:text-3xl md:text-4xl">
              Current offers
            </h2>
          </div>

          {claimSuccess ? (
            <p className="mx-auto mt-8 max-w-xl text-center text-sm text-emerald-400/90">
              {claimSuccess}
            </p>
          ) : null}
          {claimError ? (
            <p className="mx-auto mt-8 max-w-xl text-center text-sm text-red-400">
              {claimError}
            </p>
          ) : null}
          {catalogLoading ? (
            <CatalogGridSkeleton />
          ) : catalogError ? (
            <div className="mt-12 flex flex-col items-center gap-4">
              <p className="text-center text-sm text-red-400">{catalogError}</p>
              <button
                type="button"
                onClick={() => setCatalogRetryKey((k) => k + 1)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-[#FFD54A]/40 hover:text-[#FFD54A]"
              >
                Try again
              </button>
            </div>
          ) : bonuses.length === 0 ? (
            <p className="mt-12 text-center text-sm text-neutral-500">
              No bonuses published yet.
            </p>
          ) : (
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {bonuses.map((b) => {
                const status = bonusStatusLabel(b)
                return (
                  <li key={b._id}>
                    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-transparent transition hover:-translate-y-0.5 hover:border-[#FFD54A]/35 hover:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                      {b.image ? (
                        <div className="aspect-[16/9] w-full overflow-hidden bg-black/40">
                          <img
                            src={b.image}
                            alt={b.title ? `${b.title} artwork` : 'Promotion'}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                        </div>
                      ) : null}
                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex items-start justify-between gap-3">
                          <span className="inline-flex rounded-lg bg-[#FFD54A]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FFD54A]">
                            {formatEnumLabel(b.bonusType)}
                          </span>
                          <span
                            className={
                              status === 'Active'
                                ? 'shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400'
                                : 'shrink-0 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400'
                            }
                          >
                            {status}
                          </span>
                        </div>
                        <h3 className="mt-5 text-lg font-semibold text-white sm:text-xl">
                          {b.title}
                        </h3>
                        {b.bonusValue ? (
                          <p className="mt-1 text-sm font-medium text-[#FFD54A]/90">
                            {b.bonusValue}
                          </p>
                        ) : null}
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-400">
                          {b.description}
                        </p>
                        {b.termsAndConditions ? (
                          <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                            {b.termsAndConditions}
                          </p>
                        ) : null}
                        <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        {token && user && status === 'Active' ? (
                          <button
                            type="button"
                            disabled={claimingId === b._id}
                            onClick={async () => {
                              setClaimSuccess(null)
                              setClaimError(null)
                              setClaimingId(b._id)
                              try {
                                await claimBonus(b._id, token)
                                setClaimSuccess(
                                  `You're in for “${b.title}”. We'll follow up if needed.`,
                                )
                              } catch (e) {
                                setClaimError(
                                  e instanceof Error ? e.message : 'Could not claim',
                                )
                              } finally {
                                setClaimingId(null)
                              }
                            }}
                            className="mt-4 w-full rounded-xl border border-[#FFD54A]/40 bg-[#FFD54A]/10 py-2.5 text-sm font-semibold text-[#FFD54A] transition hover:bg-[#FFD54A]/20 disabled:opacity-50"
                            aria-busy={claimingId === b._id}
                          >
                            {claimingId === b._id ? 'Claiming…' : 'Claim offer'}
                          </button>
                        ) : (
                          <p className="mt-4 text-xs text-neutral-500">
                            {status !== 'Active'
                              ? 'This offer is not available right now.'
                              : 'Sign in to claim this offer.'}
                          </p>
                        )}
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
