import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import { staffJson, StaffApiError } from '../../services/staffApi'

type ReferredBy = { id: string; email: string; referralCode: string }

type Row = {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  isEmailVerified: boolean
  referralCode?: string
  referredBy?: ReferredBy | null
  createdAt: string
}

export function AdminUsersPage() {
  const token = useStaffAuthStore((s) => s.token)
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const t = setTimeout(() => {
      ;(async () => {
        try {
          const params = new URLSearchParams({ page: '1', limit: '50' })
          if (q.trim()) params.set('q', q.trim())
          const res = await staffJson<{ users: Row[]; total: number }>(
            `/admin/users?${params}`,
            token,
          )
          if (!cancelled) {
            setRows(res.users)
            setTotal(res.total)
            setError(null)
          }
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof StaffApiError ? e.message : 'Failed to load')
          }
        }
      })()
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [token, q])

  async function verifyEmail(userId: string) {
    if (!token) return
    setVerifyingId(userId)
    try {
      await staffJson(`/admin/users/${userId}/verify-email`, token, {
        method: 'PUT',
        body: JSON.stringify({}),
      })
      toast.success('Email marked verified')
      const params = new URLSearchParams({ page: '1', limit: '50' })
      if (q.trim()) params.set('q', q.trim())
      const res = await staffJson<{ users: Row[]; total: number }>(
        `/admin/users?${params}`,
        token,
      )
      setRows(res.users)
      setTotal(res.total)
    } catch (e) {
      toast.error(e instanceof StaffApiError ? e.message : 'Verify failed')
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <div>
      <input
        type="search"
        placeholder="Search email, name, phone, referral…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mt-2 w-full max-w-md rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
      />
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <p className="mt-2 text-xs text-slate-500">{total.toLocaleString()} total</p>
      <div className="mt-6 overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200 bg-white shadow-sm [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email status</th>
              <th className="px-4 py-3">Referral</th>
              <th className="px-4 py-3">Referred by</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-slate-50/80"
              >
                <td className="px-4 py-3 text-slate-900">
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-slate-600">{u.phoneNumber}</td>
                <td className="px-4 py-3">
                  {u.isEmailVerified ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      Verified
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                      Unverified
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                  {u.referralCode ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {u.referredBy?.email
                    ? `${u.referredBy.email}${u.referredBy.referralCode ? ` · ${u.referredBy.referralCode}` : ''}`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {!u.isEmailVerified ? (
                    <button
                      type="button"
                      disabled={verifyingId === u.id}
                      onClick={() => verifyEmail(u.id)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-40"
                    >
                      {verifyingId === u.id ? '…' : 'Verify email'}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
