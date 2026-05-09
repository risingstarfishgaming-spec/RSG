import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import { staffJson, StaffApiError } from '../../services/staffApi'

type Label = { id: string; name: string; color: string }
type Note = { id: string; body: string; createdAt: string; staffId?: string }
type Msg = { id: string; body: string; direction: string; createdAt: string }

type ReferredBy = { id: string; email: string; referralCode: string }

type UserDetail = {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    isEmailVerified?: boolean
    referralCode?: string
    referredBy?: ReferredBy | null
    crmLabelIds?: string[]
  }
  labels: Label[]
  notes: Note[]
}

export function AgentClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const token = useStaffAuthStore((s) => s.token)
  const [data, setData] = useState<UserDetail | null>(null)
  const [catalog, setCatalog] = useState<Label[]>([])
  const [messages, setMessages] = useState<Msg[]>([])
  const [noteBody, setNoteBody] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [newLabelName, setNewLabelName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [verifyingEmail, setVerifyingEmail] = useState(false)

  async function loadAll() {
    if (!token || !id) return
    try {
      const [u, labelsRes, msgRes] = await Promise.all([
        staffJson<UserDetail>(`/agent/users/${id}`, token),
        staffJson<{ labels: Label[] }>('/agent/labels', token),
        staffJson<{ messages: Msg[] }>(`/agent/users/${id}/messages`, token),
      ])
      setData(u)
      setCatalog(labelsRes.labels)
      setMessages(msgRes.messages)
      setError(null)
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : 'Failed to load')
    }
  }

  useEffect(() => {
    loadAll()
  }, [token, id])

  const selectedIds = new Set(data?.user.crmLabelIds ?? [])

  async function toggleLabel(labelId: string) {
    if (!token || !id || !data) return
    const next = new Set(selectedIds)
    if (next.has(labelId)) next.delete(labelId)
    else next.add(labelId)
    try {
      await staffJson(`/agent/users/${id}/labels`, token, {
        method: 'PATCH',
        body: JSON.stringify({ labelIds: [...next] }),
      })
      setInfo('Labels updated.')
      await loadAll()
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : 'Update failed')
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !id) return
    try {
      await staffJson(`/agent/users/${id}/notes`, token, {
        method: 'POST',
        body: JSON.stringify({ body: noteBody }),
      })
      setNoteBody('')
      setInfo('Note saved.')
      await loadAll()
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : 'Failed')
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !id) return
    try {
      await staffJson(`/agent/users/${id}/messages`, token, {
        method: 'POST',
        body: JSON.stringify({ body: msgBody }),
      })
      setMsgBody('')
      setInfo('Message sent.')
      await loadAll()
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : 'Failed')
    }
  }

  async function verifyEmail() {
    if (!token || !id) return
    setVerifyingEmail(true)
    try {
      await staffJson(`/agent/users/${id}/verify-email`, token, {
        method: 'PUT',
        body: JSON.stringify({}),
      })
      setInfo('Email marked verified.')
      await loadAll()
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : 'Verify failed')
    } finally {
      setVerifyingEmail(false)
    }
  }

  async function createLabel(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    try {
      await staffJson('/agent/labels', token, {
        method: 'POST',
        body: JSON.stringify({ name: newLabelName }),
      })
      setNewLabelName('')
      setInfo('Label created.')
      await loadAll()
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : 'Failed')
    }
  }

  if (!id) return null

  return (
    <div>
      <Link
        to="/agent/clients"
        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
      >
        ← Clients
      </Link>
      {data ? (
        <div className="mt-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            {data.user.firstName} {data.user.lastName}
          </h1>
          <p className="text-sm text-slate-500">{data.user.phoneNumber}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {data.user.isEmailVerified ? (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                Email verified
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400">
                Email not verified
              </span>
            )}
            {!data.user.isEmailVerified ? (
              <button
                type="button"
                disabled={verifyingEmail}
                onClick={() => verifyEmail()}
                className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {verifyingEmail ? 'Working…' : 'Verify email'}
              </button>
            ) : null}
          </div>
          {data.user.referralCode ? (
            <p className="mt-2 text-xs text-slate-500">
              Referral code{' '}
              <span className="font-mono text-slate-800">
                {data.user.referralCode}
              </span>
              {data.user.referredBy?.referralCode
                ? ` · referred by code ${data.user.referredBy.referralCode}`
                : ''}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {info ? <p className="mt-2 text-sm text-emerald-700">{info}</p> : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Labels</h2>
          <p className="mt-1 text-xs text-slate-500">
            Toggle applies to this client immediately.
          </p>
          <ul className="mt-4 space-y-2">
            {catalog.map((l) => (
              <li key={l.id}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(l.id)}
                    onChange={() => toggleLabel(l.id)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: l.color }}
                  />
                  {l.name}
                </label>
              </li>
            ))}
          </ul>
          <form
            onSubmit={createLabel}
            className="mt-6 flex gap-2"
          >
            <input
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="New label name"
              className="min-w-0 flex-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
              required
            />
            <button
              type="submit"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Add
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Notes</h2>
          <p className="mt-1 text-xs text-slate-500">
            Shared with admins and other agents on chat.
          </p>
          <ul className="mt-4 max-h-48 space-y-3 overflow-y-auto text-sm">
            {data?.notes.map((n) => (
              <li
                key={n.id}
                className="border-b border-slate-100 pb-2 text-slate-600"
              >
                {n.body}
                <span className="mt-1 block text-xs text-slate-500">
                  {new Date(n.createdAt).toLocaleString()}
                  {n.staffId ? ` · ${n.staffId.slice(-6)}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <form
            onSubmit={addNote}
            className="mt-4 space-y-2"
          >
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={3}
              placeholder="Add a note…"
              className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
              required
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Save note
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Messages</h2>
          <p className="mt-1 text-xs text-slate-500">
            Stored thread with this client (member inbox UI can be added next).
          </p>
          <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
            {messages.map((m) => (
              <li
                key={m.id}
                className={
                  m.direction === 'agent_to_user'
                    ? 'text-right font-medium text-indigo-700'
                    : 'text-left text-slate-700'
                }
              >
                {m.body}
              </li>
            ))}
          </ul>
          <form
            onSubmit={sendMessage}
            className="mt-4 flex gap-2"
          >
            <input
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              placeholder="Message to client…"
              className="min-w-0 flex-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
              required
            />
            <button
              type="submit"
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
