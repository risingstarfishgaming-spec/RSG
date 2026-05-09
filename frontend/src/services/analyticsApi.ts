import { apiUrl } from '../utils/api'

let flushTimer: ReturnType<typeof setTimeout> | null = null
const queue: { sessionId: string; type: string; path: string; meta?: Record<string, unknown> }[] = []
const MAX_BATCH = 25
const FLUSH_MS = 4000

function getSessionId(): string {
  const key = 'rsfg_anon_session'
  try {
    let id = sessionStorage.getItem(key)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      sessionStorage.setItem(key, id)
    }
    return id
  } catch {
    return `sess_${Date.now()}`
  }
}

function flush(token?: string | null) {
  if (queue.length === 0) return
  const batch = queue.splice(0, queue.length)
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  void fetch(apiUrl('/analytics/events'), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      events: batch.map((e) => ({
        sessionId: e.sessionId,
        type: e.type,
        path: e.path,
        meta: e.meta ?? {},
      })),
    }),
  }).catch(() => {
    /* drop — analytics should not break the app */
  })
}

export function trackPageView(path: string, token?: string | null) {
  const sessionId = getSessionId()
  queue.push({ sessionId, type: 'page_view', path })
  if (queue.length >= MAX_BATCH) {
    if (flushTimer) clearTimeout(flushTimer)
    flushTimer = null
    flush(token)
    return
  }
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null
      flush(token)
    }, FLUSH_MS)
  }
}

export function trackFunnelStep(
  step: string,
  meta?: Record<string, unknown>,
  token?: string | null,
) {
  const sessionId = getSessionId()
  queue.push({
    sessionId,
    type: 'funnel_step',
    path: typeof window !== 'undefined' ? window.location.pathname : '',
    meta: { step, ...meta },
  })
  if (queue.length >= MAX_BATCH) {
    if (flushTimer) clearTimeout(flushTimer)
    flushTimer = null
    flush(token)
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null
      flush(token)
    }, FLUSH_MS)
  }
}
