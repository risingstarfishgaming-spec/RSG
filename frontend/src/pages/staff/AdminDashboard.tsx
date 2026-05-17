import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { StaffOverviewMetrics } from '../../components/staff/StaffOverviewMetrics'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import { staffJson, StaffApiError } from '../../services/staffApi'

type Overview = {
  rangeDays: number
  totalEvents: number
  uniqueSessions: number
  topPaths: { path: string; pageViews: number }[]
}

export function AdminDashboard() {
  const token = useStaffAuthStore((s) => s.admin?.token ?? null)
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const o = await staffJson<Overview>('/admin/analytics/overview?days=7', token)
        if (!cancelled) setData(o)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof StaffApiError ? e.message : 'Failed to load')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="space-y-10">
      <StaffOverviewMetrics
        token={token}
        apiBase="/admin"
      />

      <div>
        <h2 className="text-lg font-medium text-slate-900">Site analytics</h2>
        <p className="mt-1 text-sm text-slate-600">
          Last 7 days from the public analytics tracker. Open{' '}
          <Link
            to="/admin/analytics"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Analytics
          </Link>{' '}
          for full breakdowns.
        </p>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        {data ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Events
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {data.totalEvents.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Sessions
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {data.uniqueSessions.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Window
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {data.rangeDays}d
              </p>
            </div>
          </div>
        ) : null}

        {data && data.topPaths.length > 0 ? (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-slate-800">Top pages</h3>
            <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
              {data.topPaths.slice(0, 8).map((p) => (
                <li
                  key={p.path}
                  className="flex justify-between px-4 py-3 text-sm"
                >
                  <span className="truncate text-slate-700">{p.path}</span>
                  <span className="shrink-0 font-medium text-indigo-600">
                    {p.pageViews}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/users"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50"
        >
          All users
        </Link>
        <Link
          to="/admin/agents"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50"
        >
          Manage agents
        </Link>
        <Link
          to="/admin/support"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50"
        >
          Support queue
        </Link>
        <Link
          to="/admin/chat"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50"
        >
          Live chat
        </Link>
      </div>
    </div>
  )
}
