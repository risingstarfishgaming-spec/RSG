import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import { staffJson, StaffApiError } from '../../services/staffApi'

type ReferredBy = { id: string; email: string; referralCode: string }

type Label = { id: string; name: string; color: string }

type Row = {
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

export function AgentClientsPage() {
  const token = useStaffAuthStore((s) => s.agent?.token ?? null)
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [error, setError] = useState<string | null>(null)

  /** id → label lookup so each row can render colored label chips. */
  const labelById = useMemo(() => {
    const m = new Map<string, Label>()
    for (const l of labels) m.set(l.id, l)
    return m
  }, [labels])

  useEffect(() => {
    if (!token) return
    void staffJson<{ labels: Label[] }>('/agent/labels', token)
      .then((res) => setLabels(res.labels))
      .catch(() => setLabels([]))
  }, [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const t = setTimeout(() => {
      ;(async () => {
        try {
          const params = new URLSearchParams({ page: '1', limit: '50' })
          if (q.trim()) params.set('q', q.trim())
          const res = await staffJson<{ users: Row[] }>(
            `/agent/users?${params}`,
            token,
          )
          if (!cancelled) {
            setRows(res.users)
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

  return (
    <div>
      <input
        type="search"
        placeholder="Search…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mt-2 w-full max-w-md rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
      />
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <ul className="mt-6 space-y-2">
        {rows.map((u) => (
          <li key={u.id}>
            <Link
              to={`/agent/clients/${u.id}`}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-indigo-200 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">
                    {u.firstName} {u.lastName}
                  </span>
                  {u.isEmailVerified ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400">
                      Verified
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-400">
                      Unverified
                    </span>
                  )}
                  {(u.crmLabelIds ?? [])
                    .map((id) => labelById.get(id))
                    .filter((l): l is Label => !!l)
                    .map((l) => (
                      <span
                        key={l.id}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: l.color }}
                          aria-hidden
                        />
                        {l.name}
                      </span>
                    ))}
                </div>
                {u.referralCode ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Code{' '}
                    <span className="font-mono text-slate-700">
                      {u.referralCode}
                    </span>
                    {u.referredBy?.referralCode
                      ? ` · from code ${u.referredBy.referralCode}`
                      : ''}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                ID {u.id.slice(-8)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
