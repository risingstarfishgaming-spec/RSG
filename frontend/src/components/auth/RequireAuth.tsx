import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuthStore } from '../../stores/authStore'

/**
 * Route guard. Redirects anonymous users to /login and preserves the path they
 * tried to reach via location.state.from for an optional post-login return.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const location = useLocation()

  if (!user || !token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <>{children}</>
}
