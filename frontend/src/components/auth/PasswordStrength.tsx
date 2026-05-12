/**
 * Lightweight password strength heuristic. Not a security gate (the server
 * enforces ≥ 8 chars); this is conversion UX so users see progress before
 * submit and avoid bouncing off a "too weak" API error.
 */

export type StrengthLevel = 0 | 1 | 2 | 3 | 4

export function scorePassword(pw: string): StrengthLevel {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  const variety =
    Number(/[a-z]/.test(pw)) +
    Number(/[A-Z]/.test(pw)) +
    Number(/\d/.test(pw)) +
    Number(/[^A-Za-z0-9]/.test(pw))
  if (variety >= 2) score++
  if (variety >= 3) score++
  if (pw.length < 8) score = 0
  return Math.min(4, score) as StrengthLevel
}

const labels: Record<StrengthLevel, string> = {
  0: 'Too short',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
}

const segmentColors: Record<StrengthLevel, string[]> = {
  0: ['bg-white/10', 'bg-white/10', 'bg-white/10', 'bg-white/10'],
  1: ['bg-red-500/80', 'bg-white/10', 'bg-white/10', 'bg-white/10'],
  2: ['bg-amber-400/85', 'bg-amber-400/85', 'bg-white/10', 'bg-white/10'],
  3: ['bg-yellow-300/85', 'bg-yellow-300/85', 'bg-yellow-300/85', 'bg-white/10'],
  4: ['bg-emerald-400/85', 'bg-emerald-400/85', 'bg-emerald-400/85', 'bg-emerald-400/85'],
}

const labelColors: Record<StrengthLevel, string> = {
  0: 'text-neutral-500',
  1: 'text-red-300',
  2: 'text-amber-200',
  3: 'text-yellow-200',
  4: 'text-emerald-300',
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = scorePassword(password)
  const colors = segmentColors[score]

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5">
        {colors.map((c, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${c}`}
            aria-hidden
          />
        ))}
      </div>
      <p
        className={`mt-1 text-xs font-medium ${labelColors[score]}`}
      >
        {password ? labels[score] : 'Use at least 8 characters. Mixing letters, numbers, and symbols helps.'}
      </p>
    </div>
  )
}
