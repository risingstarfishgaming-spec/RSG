import { useState } from 'react'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import { staffJson, StaffApiError } from '../../services/staffApi'

export function AdminSmsPage() {
  const token = useStaffAuthStore((s) => s.token)
  const [userIds, setUserIds] = useState('')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setResult(null)
    setLoading(true)
    try {
      const ids = userIds
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      const res = await staffJson<{
        message: string
        accepted: number
        jobId: string
      }>('/admin/sms/bulk', token, {
        method: 'POST',
        body: JSON.stringify({ userIds: ids, message }),
      })
      setResult(`${res.message} Job ${res.jobId} (${res.accepted} numbers).`)
    } catch (err) {
      setResult(
        err instanceof StaffApiError ? err.message : 'Request failed',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/*
      <p className="max-w-2xl text-sm text-slate-600">
        Stub provider / Twilio / smsService.ts / Mongo user ids…
      </p>
      */}
      <p className="max-w-2xl text-sm text-slate-600">
        Send a message to selected members. Enter one user ID per line or
        comma-separated values.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 max-w-xl space-y-4"
      >
        <div>
          <label
            htmlFor="sms-ids"
            className="text-xs font-medium text-slate-600"
          >
            User IDs
          </label>
          <textarea
            id="sms-ids"
            value={userIds}
            onChange={(e) => setUserIds(e.target.value)}
            rows={5}
            placeholder="64f2…abc1&#10;64f2…abc2"
            className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
            required
          />
        </div>
        <div>
          <label
            htmlFor="sms-body"
            className="text-xs font-medium text-slate-600"
          >
            Message
          </label>
          <textarea
            id="sms-body"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
            required
            maxLength={1600}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send bulk SMS'}
        </button>
      </form>

      {result ? (
        <p className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          {result}
        </p>
      ) : null}
    </div>
  )
}
