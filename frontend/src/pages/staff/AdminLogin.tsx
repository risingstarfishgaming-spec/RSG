import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { getMainSiteUrl } from '../../utils/staffPortal'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import { staffJson } from '../../services/staffApi'
import type { StaffUser } from '../../types/staff'

export function AdminLogin() {
  const navigate = useNavigate()
  const setAuth = useStaffAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await staffJson<{ token: string; staff: StaffUser }>(
        '/staff/login',
        null,
        {
          method: 'POST',
          body: JSON.stringify({ email, password, intent: 'admin' }),
        },
      )
      setAuth(data.token, data.staff)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-12 pb-[max(3rem,env(safe-area-inset-bottom,0px)+1rem)] pt-[max(3rem,env(safe-area-inset-top,0px)+1.5rem)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.3), transparent 40%)',
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Sign in
        </h1>
        <form
          className="mt-8 space-y-4"
          onSubmit={onSubmit}
        >
          <div>
            <label
              htmlFor="admin-email"
              className="text-xs font-medium text-slate-300"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 min-h-12 w-full rounded-xl border-2 border-white/20 bg-white/90 px-4 py-3 text-base text-slate-900 shadow-inner outline-none backdrop-blur placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
              required
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="text-xs font-medium text-slate-300"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 min-h-12 w-full rounded-xl border-2 border-white/20 bg-white/90 px-4 py-3 text-base text-slate-900 shadow-inner outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-red-200">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full touch-manipulation rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-base font-semibold text-white shadow-lg transition hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-300">
          <Link
            to="/agent/login"
            className="font-medium text-blue-200 hover:text-white hover:underline"
          >
            Agent login
          </Link>
          {' · '}
          <a
            href={getMainSiteUrl()}
            className="hover:text-white hover:underline"
          >
            Main site
          </a>
        </p>
      </div>
    </main>
  )
}
