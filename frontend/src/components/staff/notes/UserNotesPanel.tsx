import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { staffFetch, staffJson } from '../../../services/staffApi'

type NoteRow = {
  id: string
  body: string
  createdAt: string
  staffId?: string
}

type Props = {
  token: string | null
  apiRole: 'admin' | 'agent'
  userId: string
  userName: string
  isOpen: boolean
  onClose: () => void
}

export default function UserNotesPanel({
  token,
  apiRole,
  userId,
  userName,
  isOpen,
  onClose,
}: Props) {
  const [notes, setNotes] = useState<NoteRow[]>([])
  const [loading, setLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchNotes = useCallback(async () => {
    if (!token || !userId) return
    setLoading(true)
    try {
      if (apiRole === 'admin') {
        const res = await staffJson<{ success?: boolean; data?: NoteRow[] }>(
          `/admin/users/${userId}/notes`,
          token,
        )
        setNotes(res.data ?? [])
      } else {
        const res = await staffJson<{ notes?: NoteRow[] }>(
          `/agent/users/${userId}/notes`,
          token,
        )
        setNotes(res.notes ?? [])
      }
    } catch (e) {
      console.error('Failed to fetch notes', e)
    } finally {
      setLoading(false)
    }
  }, [token, userId, apiRole])

  useEffect(() => {
    if (isOpen && userId) void fetchNotes()
  }, [isOpen, userId, fetchNotes])

  async function handleAddNote() {
    if (!newNote.trim() || saving || !token) return
    setSaving(true)
    try {
      if (apiRole === 'admin') {
        const res = await staffFetch(`/admin/users/${userId}/notes`, token, {
          method: 'POST',
          body: JSON.stringify({ body: newNote.trim() }),
        })
        const text = await res.text()
        let parsed: { success?: boolean; data?: NoteRow } = {}
        try {
          parsed = text ? (JSON.parse(text) as typeof parsed) : {}
        } catch {
          /* ignore */
        }
        if (res.ok && parsed.data) {
          setNotes((prev) => [parsed.data!, ...prev])
          setNewNote('')
        }
      } else {
        const res = await staffFetch(`/agent/users/${userId}/notes`, token, {
          method: 'POST',
          body: JSON.stringify({ body: newNote.trim() }),
        })
        const text = await res.text()
        let parsed: { note?: NoteRow } = {}
        try {
          parsed = text ? (JSON.parse(text) as typeof parsed) : {}
        } catch {
          /* ignore */
        }
        if (res.ok && parsed.note) {
          setNotes((prev) => [parsed.note!, ...prev])
          setNewNote('')
        }
      }
    } catch (e) {
      console.error('Failed to add note', e)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-black/40 p-2 sm:p-4">
      <div
        className="flex h-full w-full max-w-md flex-col rounded-xl border border-gray-200 bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="notes-panel-title"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 id="notes-panel-title" className="text-sm font-semibold text-gray-900">
            Notes — {userName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-gray-500">No notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                  <p className="whitespace-pre-wrap text-gray-800">{n.body}</p>
                  <p className="mt-2 text-[10px] text-gray-400">
                    {new Date(n.createdAt).toLocaleString()}
                    {n.staffId ? ` · ${n.staffId.slice(-6)}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-gray-200 p-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            placeholder="Add a note…"
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            maxLength={8000}
          />
          <button
            type="button"
            onClick={() => void handleAddNote()}
            disabled={saving || !newNote.trim()}
            className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save note'}
          </button>
        </div>
      </div>
    </div>
  )
}
