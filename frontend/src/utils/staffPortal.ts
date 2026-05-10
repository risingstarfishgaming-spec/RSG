/**
 * Production staff hosts (same SPA build, staff-only routes):
 * - `super.yourdomain.com` (legacy naming)
 * - `admin.yourdomain.com` (e.g. admin.rsfgaming.com → /admin, /agent)
 * Local: add `127.0.0.1 super.localhost` or `admin.localhost` to hosts — `/` redirects to the main site.
 * Or set VITE_FORCE_STAFF_PORTAL=true (then set VITE_MAIN_SITE_URL so `/` can redirect).
 */
function isStaffPortalHostname(hostname: string): boolean {
  return (
    hostname === 'super.localhost' ||
    hostname === 'admin.localhost' ||
    hostname.startsWith('super.') ||
    hostname.startsWith('admin.')
  )
}

export function isSuperStaffHost(): boolean {
  /** Local dev without staff DNS — entire app becomes staff-only routes. */
  if (import.meta.env.VITE_FORCE_STAFF_PORTAL === 'true') return true
  if (typeof window === 'undefined') return false
  return isStaffPortalHostname(window.location.hostname)
}

/**
 * Public marketing / member site — used to leave staff portal hosts from `/` or bad paths.
 * Set `VITE_MAIN_SITE_URL` in production (e.g. https://rsfgaming.com).
 * On staff localhost hosts, defaults to same-port `http://localhost:5173`.
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
