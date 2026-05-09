import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { PageHero } from '../components/page/PageHero'
import {
  createSupportTicket,
  listMySupportTickets,
  type MyTicketSummary,
  type SupportCategory,
} from '../services/supportApi'
import { useAuthStore } from '../stores/authStore'

export default function Support() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<SupportCategory>('general')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mine, setMine] = useState<MyTicketSummary[]>([])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    listMySupportTickets(token)
      .then((t) => {
        if (!cancelled) setMine(t)
      })
      .catch(() => {
        /* ignore */
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setErr(null)
    setMsg(null)
    setLoading(true)
    try {
      await createSupportTicket(token, {
        subject,
        body,
        category,
        attachment: attachment ?? undefined,
      })
      setMsg('Ticket submitted. We will follow up by email when possible.')
      setSubject('')
      setBody('')
      setAttachment(null)
      const t = await listMySupportTickets(token)
      setMine(t)
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not submit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-[#0a0a0b]">
      <PageHero
        eyebrow="Help center"
        title="Support"
        description="Open a ticket while signed in—it appears in the admin support queue."
      />

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-5">
          {!token ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
              <p className="text-sm text-neutral-200">
                <Link
                  to="/login"
                  className="font-semibold text-[#FFD700] underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>{' '}
                to submit a support ticket.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white">New ticket</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Signed in as {user?.email}
              </p>
              <form
                className="mt-6 space-y-4"
                onSubmit={onSubmit}
              >
                <div>
                  <label
                    htmlFor="ticket-subject"
                    className="text-xs font-medium text-neutral-400"
                  >
                    Subject
                  </label>
                  <input
                    id="ticket-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white outline-none focus:border-[#FFD700]/50"
                    required
                    minLength={3}
                    maxLength={200}
                  />
                </div>
                <div>
                  <label
                    htmlFor="ticket-category"
                    className="text-xs font-medium text-neutral-400"
                  >
                    Category
                  </label>
                  <select
                    id="ticket-category"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as SupportCategory)
                    }
                    className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white outline-none focus:border-[#FFD700]/50"
                  >
                    <option value="general">General</option>
                    <option value="payment_related_queries">Payment</option>
                    <option value="game_issue">Game issue</option>
                    <option value="complaint">Complaint</option>
                    <option value="feedback">Feedback</option>
                    <option value="business_queries">Business</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="ticket-body"
                    className="text-xs font-medium text-neutral-400"
                  >
                    Details
                  </label>
                  <textarea
                    id="ticket-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white outline-none focus:border-[#FFD700]/50"
                    required
                    minLength={10}
                    maxLength={16000}
                  />
                </div>
                <div>
                  <label
                    htmlFor="ticket-file"
                    className="text-xs font-medium text-neutral-400"
                  >
                    Attachment (optional, image or PDF)
                  </label>
                  <input
                    id="ticket-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                    onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                    className="mt-1 block w-full text-sm text-neutral-400"
                  />
                </div>
                {err ? <p className="text-sm text-red-400">{err}</p> : null}
                {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
                <button
                  type="submit"
                  disabled={loading}
                  className="touch-manipulation rounded-xl bg-[#FFD700] px-6 py-3 text-base font-bold text-neutral-950 disabled:opacity-50"
                >
                  {loading ? 'Submitting…' : 'Submit ticket'}
                </button>
              </form>
            </div>
          )}

          {token && mine.length > 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white">Your tickets</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {mine.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3"
                  >
                    <div>
                      <span className="text-neutral-200">{t.subject}</span>
                      {t.ticketNumber ? (
                        <p className="mt-0.5 text-[10px] text-neutral-500">
                          {t.ticketNumber}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-xs text-[#FFD700]">
                      {t.status}
                      {typeof t.replyCount === 'number' && t.replyCount > 0
                        ? ` · ${t.replyCount} repl${t.replyCount === 1 ? 'y' : 'ies'}`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-white">Email</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              For account or billing questions:{' '}
              <a
                href="mailto:support@example.com"
                className="font-semibold text-[#FFD700] underline-offset-4 hover:underline"
              >
                support@example.com
              </a>
              <span className="text-neutral-500">
                {' '}
                — replace with your production address.
              </span>
            </p>
          </div>
        </div>

        <p className="mx-auto mt-12 max-w-3xl text-center text-sm text-neutral-500">
          Need something else?{' '}
          <Link
            to="/"
            className="font-medium text-[#FFD700] underline-offset-4 hover:underline"
          >
            Back to home
          </Link>
        </p>
      </section>
    </main>
  )
}
