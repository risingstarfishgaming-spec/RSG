import { useAuthStore } from '../stores/authStore'
import { trackFunnelStep as sendFunnel, trackPageView as sendPage } from './analyticsApi'

/** Page view — batched to POST /api/analytics/events */
export function trackPageView(path: string) {
  const token = useAuthStore.getState().token
  sendPage(path, token)
}

/** Funnel / drop-off analysis — uses type funnel_step + meta.step */
export function trackEvent(name: string, payload?: Record<string, unknown>) {
  const token = useAuthStore.getState().token
  sendFunnel(name, payload, token)
}
