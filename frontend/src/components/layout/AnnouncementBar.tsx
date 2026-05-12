import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'

const linkClass =
  'font-semibold text-[#2EC5FF] underline-offset-2 transition hover:text-[#7ddcff] hover:underline'

/** Stable list; order is shuffled once on mount (game-style loading tips). */
const ANNOUNCEMENTS: { emoji: string; content: React.ReactNode }[] = [
  { emoji: '🎉', content: 'Get up to 20% bonus on recharge.' },
  { emoji: '⚡', content: 'Fast withdrawals — we keep things moving when you cash out.' },
  { emoji: '📢', content: 'Maintenance windows are announced here — thanks for your patience.' },
  { emoji: '🌟', content: 'Join our growing gaming community and rise like a star.' },
  {
    emoji: '🎁',
    content: (
      <>
        Check the latest bonuses on our{' '}
        <Link to="/bonuses" className={linkClass}>
          Bonuses
        </Link>{' '}
        page.
      </>
    ),
  },
  {
    emoji: '🎮',
    content: (
      <>
        Tired of the same games? Browse fresh partner picks on our{' '}
        <Link to="/platforms" className={linkClass}>
          Platforms
        </Link>{' '}
        page.
      </>
    ),
  },
  {
    emoji: '🎯',
    content: (
      <>
        Curated highlights live on the{' '}
        <Link to="/games" className={linkClass}>
          Games
        </Link>{' '}
        page — new titles rotate in regularly.
      </>
    ),
  },
  {
    emoji: '💬',
    content: (
      <>
        Need a hand? Reach us via{' '}
        <Link to="/support" className={linkClass}>
          Support
        </Link>{' '}
        or live{' '}
        <Link to="/chat" className={linkClass}>
          Chat
        </Link>{' '}
        {'when we\'re online.'}
      </>
    ),
  },
  { emoji: '🛡️', content: 'Secure recharge flows and a team focused on fair play.' },
  {
    emoji: '🕐',
    content:
      'We are open around the clock except 12:00 PM – 6:00 PM CST daily — plan support and play accordingly.',
  },
  {
    emoji: '✉️',
    content: 'Verify your email to unlock bonuses and keep your account secure.',
  },
  {
    emoji: '📣',
    content: (
      <>
        Read how we operate in our{' '}
        <Link to="/about" className={linkClass}>
          About
        </Link>{' '}
        section — transparency matters.
      </>
    ),
  },
  {
    emoji: '💡',
    content: (
      <>
        Did you know? You can get up to $10 bonus on your referrals — see your code on{' '}
        <Link to="/bonuses" className={linkClass}>
          Bonuses
        </Link>
        .
      </>
    ),
  },
  {
    emoji: '🧾',
    content: (
      <>
        For fastest help, include your username and transaction details when contacting{' '}
        <Link to="/support" className={linkClass}>
          Support
        </Link>
        .
      </>
    ),
  },
  {
    emoji: '🔐',
    content: 'Keep your account safe — never share your password or OTP.',
  },
  {
    emoji: '🔥',
    content: (
      <>
        Hot promotions rotate often — check{' '}
        <Link to="/bonuses" className={linkClass}>
          Bonuses
        </Link>{' '}
        before your next recharge.
      </>
    ),
  },
  {
    emoji: '⭐',
    content:
      'Rising Star members get updates, support, and offers in one place.',
  },
  {
    emoji: '📌',
    content:
      'Important updates, recharge notes, and support info appear here first.',
  },
  {
    emoji: '💚',
    content:
      'Play smart, stay responsible, and enjoy the Rising Star experience.',
  },
  {
    emoji: '🌟',
    content:
      'Did you know? A rising star can shine thousands of times brighter than our Sun.',
  },
  {
    emoji: '🎰',
    content:
      'Did you know? The first casino was opened in Venice, Italy in 1638.',
  },
  {
    emoji: '🐃',
    content: 'Wild buffalo can run up to 35 mph despite their massive size.',
  },
  {
    emoji: '🌌',
    content:
      'Some stars visible tonight are millions of light-years away from Earth.',
  },
  {
    emoji: '🎲',
    content:
      'The word “casino” originally meant a small social gathering place in Italian.',
  },
  {
    emoji: '🎰',
    content:
      'Slot machines are one of the most played casino games worldwide.',
  },
  {
    emoji: '🃏',
    content:
      'The King of Hearts is the only king in a standard deck without a mustache.',
  },
]

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const ROTATE_MS = 6500
const ROTATE_MS_REDUCED = 12000

type AnnouncementBarProps = {
  /** `hero` = plain text on home hero (no box); `strip` = full-width bar */
  variant?: 'strip' | 'hero'
}

export function AnnouncementBar({ variant = 'strip' }: AnnouncementBarProps) {
  const order = useMemo(() => shuffle(ANNOUNCEMENTS.map((_, i) => i)), [])
  const [pos, setPos] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const ms = reducedMotion ? ROTATE_MS_REDUCED : ROTATE_MS
    const id = window.setInterval(() => {
      setPos((p) => (p + 1) % order.length)
    }, ms)
    return () => window.clearInterval(id)
  }, [order.length, reducedMotion])

  const idx = order[pos % order.length] ?? 0
  const item = ANNOUNCEMENTS[idx]

  const shell =
    variant === 'hero'
      ? 'relative text-sm leading-relaxed text-white/90 drop-shadow-[0_1px_12px_rgba(0,0,0,0.55)] sm:text-base'
      : 'relative overflow-hidden border-b border-[#FFD54A]/10 bg-[#080E1A] text-sm text-neutral-300 sm:text-base'

  return (
    <div role="region" aria-label="Announcements" aria-live="polite" className={shell}>
      <div
        className={
          variant === 'hero'
            ? 'mx-auto flex min-h-[2.75rem] max-w-2xl items-center justify-center px-2 py-1 text-center sm:min-h-[3rem] sm:max-w-3xl sm:px-4'
            : 'mx-auto flex min-h-[2.75rem] max-w-6xl items-center justify-center px-3 py-2.5 text-center sm:min-h-[3rem] sm:px-6'
        }
      >
        {item ? (
          <p
            key={`${pos}-${idx}`}
            className={
              reducedMotion
                ? variant === 'hero'
                  ? 'max-w-2xl leading-relaxed text-white/90 sm:max-w-3xl'
                  : 'max-w-4xl leading-relaxed text-neutral-200'
                : variant === 'hero'
                  ? 'animate-announcement-in max-w-2xl leading-relaxed text-white/90 sm:max-w-3xl'
                  : 'animate-announcement-in max-w-4xl leading-relaxed text-neutral-200'
            }
          >
            <span className="mr-2 shrink-0 text-[1.15em] leading-none" aria-hidden>
              {item.emoji}
            </span>
            {item.content}
          </p>
        ) : null}
      </div>
    </div>
  )
}
