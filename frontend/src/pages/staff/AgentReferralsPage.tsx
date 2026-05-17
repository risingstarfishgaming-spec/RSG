import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import { staffJson, StaffApiError } from '../../services/staffApi'

type RefUserMini = {
  _id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  createdAt: string
}

type ReferralRow = {
  _id: string
  referredUser: RefUserMini | null
  referredBy: (RefUserMini & { referralCode: string }) | null
  referralCode: string
  status: string
  bonusGranted: boolean
  bonusAmount: number
  verifiedAt?: string
  verifiedBy?: string
  createdAt: string
}

type Filter = 'all' | 'pending' | 'verified'

export function AgentReferralsPage() {
  const token = useStaffAuthStore((s) => s.agent?.token ?? null)
  const [filter, setFilter] = useState<Filter>('all')
  const [rows, setRows] = useState<ReferralRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: '1', limit: '100' })
      if (filter === 'pending' || filter === 'verified') {
        params.set('status', filter)
      }
      const res = await staffJson<{
        success: boolean
        data: ReferralRow[]
      }>(`/agent/referrals?${params}`, token)
      setRows(res.data)
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [token, filter])

  useEffect(() => {
    load()
  }, [load])

  async function verify(id: string) {
    if (!token) return
    setVerifyingId(id)
    try {
      await staffJson(`/agent/referrals/${id}/verify`, token, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      toast.success('Referral verified')
      await load()
    } catch (e) {
      toast.error(e instanceof StaffApiError ? e.message : 'Verify failed')
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <div>
      <p className="text-sm text-slate-600">
        Review signups that used an agent code. Verify when ready — both users
        get a system chat notice.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(['all', 'pending', 'verified'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-indigo-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading…</p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {rows.map((r) => {
          const who = r.referredUser
          const refBy = r.referredBy
          const name = who
            ? [who.firstName, who.lastName].filter(Boolean).join(' ') ||
              who.username
            : '—'
          return (
            <li
              key={r._id}
              className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500">
                    Code{' '}
                    <span className="text-slate-800">{r.referralCode}</span>
                    {refBy ? (
                      <>
                        {' '}
                        · Referred by {refBy.username}
                        {refBy.referralCode
                          ? ` (${refBy.referralCode})`
                          : ''}
                      </>
                    ) : null}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {r.status}
                    {r.verifiedAt
                      ? ` · ${new Date(r.verifiedAt).toLocaleString()}`
                      : ''}
                    {r.verifiedBy ? ` · ${r.verifiedBy}` : ''}
                  </p>
                </div>
                {r.status === 'pending' ? (
                  <button
                    type="button"
                    disabled={verifyingId === r._id}
                    onClick={() => verify(r._id)}
                    className="shrink-0 rounded-lg bg-emerald-600/90 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {verifyingId === r._id ? 'Verifying…' : 'Verify'}
                  </button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>

      {!loading && rows.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">No referrals yet.</p>
      ) : null}
    </div>
  )
}
