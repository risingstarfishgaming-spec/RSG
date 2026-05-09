import { useEffect, useState } from 'react'
import { staffJson, StaffApiError } from '../../services/staffApi'

export type DashboardSummary = {
  newUsersToday: number
  newReferralsToday: number
  messagesReceivedWeek: number
  busyHours: { hour: number; count: number }[]
  weekStartsAtUtc: string
  dayStartsAtUtc: string
}

type Props = {
  token: string | null
  apiBase: '/admin' | '/agent'
}

export function StaffOverviewMetrics({ token, apiBase }: Props) {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await staffJson<{ success: boolean; data: DashboardSummary }>(
          `${apiBase}/dashboard/summary`,
          token,
        )
        if (!cancelled) {
          setData(res.data)
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
  }, [token, apiBase])

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }
  if (!token) {
    return null
  }
  if (!data) {
    return <p className="text-sm text-slate-500">Loading overview…</p>
  }

  const maxBusy = Math.max(1, ...data.busyHours.map((b) => b.count))
  const weekStart = new Date(data.weekStartsAtUtc)
  const chartMaxPx = 112

  return (
    <div className="space-y-8">
      {/*
      <p className="text-xs text-slate-500">
        … senderType: user, UTC week…
      </p>
      */}
      <p className="text-xs text-slate-500">
        <strong>New signups and referrals</strong> use today (UTC midnight).{' '}
        <strong>Messages and busy hours</strong> use member chat in the week
        starting{' '}
        <strong>
          {weekStart.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </strong>
        — each new week begins Sunday 00:00 UTC.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            New users today
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
            {data.newUsersToday.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Messages received
          </p>
          <p className="mt-1 text-[11px] text-slate-400">This UTC week</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
            {data.messagesReceivedWeek.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            New referrals
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Created today (UTC)</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
            {data.newReferralsToday.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Peak hour (UTC)
          </p>
          <p className="mt-1 text-[11px] text-slate-400">From busy-hour chart</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
            {(() => {
              let bestH = 0
              let bestC = -1
              for (const { hour, count } of data.busyHours) {
                if (count > bestC) {
                  bestC = count
                  bestH = hour
                }
              }
              return bestC <= 0 ? '—' : `${bestH}:00`
            })()}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Busy hours (UTC, this week)
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Volume of member chat messages by hour of day. Resets when the UTC
          week rolls over on Sunday.
        </p>
        <div className="mt-6 flex h-[140px] items-end gap-0.5 sm:gap-1">
          {data.busyHours.map(({ hour, count }) => {
            const hPx =
              count === 0 ? 0 : Math.max(6, (count / maxBusy) * chartMaxPx)
            return (
              <div
                key={hour}
                className="flex min-w-0 flex-1 flex-col items-center justify-end"
              >
                <div
                  className="w-full max-w-[28px] rounded-t bg-indigo-500 transition-colors hover:bg-indigo-600"
                  style={{ height: hPx }}
                  title={`${hour}:00 UTC — ${count} message(s)`}
                />
                <span className="mt-1.5 text-[10px] tabular-nums text-slate-400">
                  {hour}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
