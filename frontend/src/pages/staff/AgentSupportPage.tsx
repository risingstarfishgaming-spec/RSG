import { useCallback, useEffect, useState } from 'react'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import { staffJson, StaffApiError } from '../../services/staffApi'

type TicketRow = {
  id: string
  ticketNumber?: string
  subject: string
  body: string
  status: string
  category: string
  createdAt: string
  replyCount?: number
  attachmentUrl?: string
  user: { firstName?: string; lastName?: string; email?: string }
}

type Reply = {
  id?: string
  message: string
  fromStaff: boolean
  staffName?: string
  createdAt: string
}

type TicketDetail = {
  id: string
  ticketNumber?: string
  subject: string
  body: string
  status: string
  category: string
  attachmentUrl?: string
  attachmentName?: string
  replies: Reply[]
  createdAt: string
  user: TicketRow['user']
}

const AGENT_STATUSES = [
  'open',
  'pending',
  'in_progress',
  'resolved',
  'closed',
] as const

export function AgentSupportPage() {
  const token = useStaffAuthStore((s) => s.token)
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<TicketDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)

  const loadList = useCallback(async () => {
    if (!token) return
    try {
      const res = await staffJson<{ tickets: TicketRow[] }>(
        '/agent/support/tickets?status=all',
        token,
      )
      setTickets(res.tickets)
      setError(null)
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : 'Failed to load')
    }
  }, [token])

  useEffect(() => {
    loadList()
  }, [loadList])

  const loadDetail = useCallback(
    async (id: string) => {
      if (!token) return
      setDetailLoading(true)
      try {
        const res = await staffJson<{ ticket: TicketDetail }>(
          `/agent/support/tickets/${id}`,
          token,
        )
        setDetail(res.ticket)
        setError(null)
      } catch (e) {
        setError(e instanceof StaffApiError ? e.message : 'Failed to load ticket')
        setDetail(null)
      } finally {
        setDetailLoading(false)
      }
    },
    [token],
  )

  useEffect(() => {
    if (selectedId) loadDetail(selectedId)
    else setDetail(null)
  }, [selectedId, loadDetail])

  async function setStatus(id: string, status: string) {
    if (!token) return
    setUpdating(id)
    try {
      await staffJson(`/agent/support/tickets/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await loadList()
      if (selectedId === id) await loadDetail(id)
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : 'Update failed')
    } finally {
      setUpdating(null)
    }
  }

  async function sendReply() {
    if (!token || !selectedId || !replyText.trim()) return
    setReplying(true)
    try {
      await staffJson(`/agent/support/tickets/${selectedId}/reply`, token, {
        method: 'POST',
        body: JSON.stringify({ message: replyText.trim() }),
      })
      setReplyText('')
      await loadDetail(selectedId)
      await loadList()
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : 'Reply failed')
    } finally {
      setReplying(false)
    }
  }

  return (
    <div>
      <p className="text-sm text-slate-600">
        View the queue, reply to members, and update status.
      </p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ul className="space-y-2">
          {tickets.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() =>
                  setSelectedId((id) => (id === t.id ? null : t.id))
                }
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selectedId === t.id
                    ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                    : 'border-slate-200 bg-white shadow-sm hover:border-indigo-200'
                }`}
              >
                <p className="font-medium text-slate-900">{t.subject}</p>
                {t.ticketNumber ? (
                  <p className="text-[10px] text-slate-500">{t.ticketNumber}</p>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">
                  {t.user?.firstName} {t.user?.lastName}
                </p>
                <p className="mt-1 text-xs font-medium text-indigo-700">
                  {t.status} · {t.category}
                </p>
              </button>
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selectedId ? (
            <p className="text-sm text-slate-500">Select a ticket.</p>
          ) : detailLoading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : detail ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {detail.subject}
                  </h2>
                  {detail.ticketNumber ? (
                    <p className="text-xs text-slate-500">{detail.ticketNumber}</p>
                  ) : null}
                </div>
                <select
                  value={detail.status}
                  disabled={updating === detail.id}
                  onChange={(e) => setStatus(detail.id, e.target.value)}
                  className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
                >
                  {AGENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {detail.body}
              </p>
              {detail.attachmentUrl ? (
                <a
                  href={detail.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                >
                  {detail.attachmentName ?? 'Attachment'}
                </a>
              ) : null}
              <ul className="max-h-40 space-y-2 overflow-y-auto text-sm">
                {detail.replies.map((r) => (
                  <li
                    key={r.id ?? r.createdAt + r.message.slice(0, 8)}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <p className="text-[10px] text-slate-500">
                      {r.fromStaff ? r.staffName ?? 'Staff' : 'Member'} ·{' '}
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-700">
                      {r.message}
                    </p>
                  </li>
                ))}
              </ul>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply…"
                rows={3}
                className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
              />
              <button
                type="button"
                disabled={replying || !replyText.trim()}
                onClick={() => sendReply()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {replying ? 'Sending…' : 'Send reply'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-red-600">Could not load ticket.</p>
          )}
        </div>
      </div>

      {tickets.length === 0 && !error ? (
        <p className="mt-8 text-sm text-slate-500">No tickets.</p>
      ) : null}
    </div>
  )
}
