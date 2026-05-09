import { useEffect, useState } from 'react'
import { getMainSiteUrl } from '../utils/staffPortal'

/** Full navigation so the browser leaves the `super.*` origin. */
export function RedirectToMainSite() {
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const base = getMainSiteUrl().replace(/\/$/, '')
    const target = `${base}/`
    try {
      if (new URL(target).origin === window.location.origin) {
        setBlocked(true)
        return
      }
    } catch {
      setBlocked(true)
      return
    }
    window.location.replace(target)
  }, [])

  if (blocked) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#0a0a0b] px-6 text-center">
        {/*
        <p className="max-w-md text-sm text-neutral-300">
          VITE_MAIN_SITE_URL, frontend/.env, super.localhost…
        </p>
        */}
        <p className="max-w-md text-sm text-neutral-300">
          Main site URL is not configured for redirect from this host. Contact
          your administrator or open the public site directly.
        </p>
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0a0a0b] px-4">
      <p className="text-sm text-neutral-400">Redirecting to main site…</p>
    </main>
  )
}
