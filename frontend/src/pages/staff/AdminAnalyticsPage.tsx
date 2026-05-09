import { useEffect, useState } from 'react'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import { staffJson, StaffApiError } from '../../services/staffApi'

type Overview = {
  rangeDays: number
  since: string
  totalEvents: number
  uniqueSessions: number
  topPaths: { path: string; pageViews: number }[]
  eventsByType: { type: string; count: number }[]
  funnelSteps: { step: string; count: number }[]
}

export function AdminAnalyticsPage() {
  const token = useStaffAuthStore((s) => s.token)
  const [days, setDays] = useState(14)
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const o = await staffJson<Overview>(
          `/admin/analytics/overview?days=${days}`,
          token,
        )
        if (!cancelled) {
          setData(o)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof StaffApiError ? e.message : 'Failed to load')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, days])

  return (
    <div>
      {/*
      <p className="max-w-2xl text-sm text-slate-600">
        Technical: POST /api/analytics/events, funnel_step, meta.step…
      </p>
      */}
      <p className="max-w-2xl text-sm text-slate-600">
        Page views, sessions, and funnel steps for the selected range.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <label
          htmlFor="days"
          className="text-sm text-slate-600"
        >
          Range
        </label>
        <select
          id="days"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
        >
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {data ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Total events</dt>
                <dd className="font-medium text-slate-900">
                  {data.totalEvents.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Unique sessions</dt>
                <dd className="font-medium text-slate-900">
                  {data.uniqueSessions.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Since</dt>
                <dd className="text-slate-800">
                  {new Date(data.since).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Drop-off hints</h2>
            <p className="mt-1 text-xs text-slate-500">
              Top page_view paths — compare volumes to spot exits.
            </p>
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm">
              {data.topPaths.map((p) => (
                <li
                  key={p.path}
                  className="flex justify-between gap-2 border-b border-slate-100 pb-2"
                >
                  <span className="truncate text-slate-700">{p.path}</span>
                  <span className="shrink-0 font-medium text-indigo-600">
                    {p.pageViews}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Events by type</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {data.eventsByType.map((t) => (
                <li
                  key={t.type}
                  className="flex justify-between"
                >
                  <span className="text-slate-600">{t.type}</span>
                  <span className="font-medium text-slate-900">{t.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Funnel steps</h2>
            <p className="mt-1 text-xs text-slate-500">
              From tracked funnel-step events.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {data.funnelSteps.length === 0 ? (
                <li className="text-slate-500">No funnel data yet.</li>
              ) : (
                data.funnelSteps.map((f) => (
                  <li
                    key={f.step}
                    className="flex justify-between"
                  >
                    <span className="text-slate-600">{f.step}</span>
                    <span className="font-medium text-slate-900">{f.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )
}
