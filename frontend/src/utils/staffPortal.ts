/**
 * Production: `super.yourdomain.com` serves only `/admin` and `/agent` SPA routes.
 * Local: add `127.0.0.1 super.localhost` to hosts — root redirects to the main site.
 * Or set VITE_FORCE_STAFF_PORTAL=true (then set VITE_MAIN_SITE_URL so `/` can redirect).
 */
export function isSuperStaffHost(): boolean {
  /** Local dev without `super.*` DNS — entire app becomes staff-only routes. */
  if (import.meta.env.VITE_FORCE_STAFF_PORTAL === 'true') return true
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'super.localhost' || h.startsWith('super.')
}

/**
 * Public marketing / member site — used to leave the `super.*` host from `/` or bad paths.
 * Set `VITE_MAIN_SITE_URL` in production (e.g. https://www.yoursite.com).
 * On `super.localhost`, defaults to same-port `http://localhost:5173`.
 * With `VITE_FORCE_STAFF_PORTAL`, you must set `VITE_MAIN_SITE_URL` if the public app shares host/port.
 */
export function getMainSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_MAIN_SITE_URL
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return fromEnv.trim().replace(/\/$/, '')
  }
  if (typeof window === 'undefined') return 'http://localhost:5173'
  const { protocol, port } = window.location
  const p = port ? `:${port}` : ''
  return `${protocol}//localhost${p}`
}
