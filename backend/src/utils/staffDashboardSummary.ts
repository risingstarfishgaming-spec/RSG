import { ChatMessage } from '../models/ChatMessage.js'
import { Referral } from '../models/Referral.js'
import { User } from '../models/User.js'

export function startOfUtcDay(d = new Date()) {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

/** Calendar week that resets each Sunday 00:00 UTC (inclusive). */
export function startOfUtcWeekSunday(d = new Date()) {
  const x = new Date(d)
  const day = x.getUTCDay()
  x.setUTCDate(x.getUTCDate() - day)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

export type StaffDashboardSummary = {
  newUsersToday: number
  newReferralsToday: number
  /** Member → staff live chat messages (senderType user) since week start. */
  messagesReceivedWeek: number
  /** Hour 0–23 UTC, counts for current UTC week (since last Sunday). */
  busyHours: { hour: number; count: number }[]
  weekStartsAtUtc: string
  dayStartsAtUtc: string
}

export async function getStaffDashboardSummary(): Promise<StaffDashboardSummary> {
  const now = new Date()
  const dayStart = startOfUtcDay(now)
  const weekStart = startOfUtcWeekSunday(now)

  const [newUsersToday, newReferralsToday, messagesReceivedWeek, busyAgg] =
    await Promise.all([
      User.countDocuments({ createdAt: { $gte: dayStart } }),
      Referral.countDocuments({ createdAt: { $gte: dayStart } }),
      ChatMessage.countDocuments({
        createdAt: { $gte: weekStart },
        senderType: 'user',
      }),
      ChatMessage.aggregate<{ _id: number; count: number }>([
        {
          $match: {
            createdAt: { $gte: weekStart },
            senderType: 'user',
          },
        },
        { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ])

  const busyHours: { hour: number; count: number }[] = Array.from(
    { length: 24 },
    (_, hour) => ({ hour, count: 0 }),
  )
  for (const row of busyAgg) {
    const h = row._id
    if (typeof h === 'number' && h >= 0 && h < 24) {
      busyHours[h].count = row.count
    }
  }

  return {
    newUsersToday,
    newReferralsToday,
    messagesReceivedWeek,
    busyHours,
    weekStartsAtUtc: weekStart.toISOString(),
    dayStartsAtUtc: dayStart.toISOString(),
  }
}
