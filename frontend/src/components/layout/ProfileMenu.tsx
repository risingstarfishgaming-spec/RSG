import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { AuthUser } from '../../types/auth'
import { useAuthStore } from '../../stores/authStore'

function userInitials(user: AuthUser): string {
  const a = user.firstName.trim().charAt(0).toUpperCase()
  const b = user.lastName.trim().charAt(0).toUpperCase()
  if (a && b) return a + b
  const one = a || b
  if (one) return one
  const e = user.email.trim().charAt(0).toUpperCase()
  return e || '?'
}

function AvatarCircle({
  user,
  className,
}: {
  user: AuthUser
  className?: string
}) {
  return (
    <span
      className={[
        'flex shrink-0 items-center justify-center rounded-full border-2 border-[#FFD700]/80 bg-gradient-to-br from-neutral-700 to-neutral-900 text-xs font-bold text-[#FFD700] sm:text-sm',
        className ?? '',
      ].join(' ')}
      aria-hidden
    >
      {userInitials(user)}
    </span>
  )
}

const menuItemClass =
  'block w-full px-4 py-2.5 text-left text-sm text-neutral-200 transition hover:bg-white/10'

const menuDangerClass =
  'block w-full px-4 py-2.5 text-left text-sm text-red-300 transition hover:bg-red-500/10'

export function HeaderProfileMenu({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full outline-none ring-offset-2 ring-offset-[#0a0a0b] focus-visible:ring-2 focus-visible:ring-[#FFD700]/70"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <AvatarCircle user={user} className="h-9 w-9 sm:h-10 sm:w-10" />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(calc(100vw-2rem),16rem)] rounded-xl border border-white/10 bg-[#141416] py-1 shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
          role="menu"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate font-semibold text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="mt-0.5 truncate text-xs text-neutral-500">{user.email}</p>
          </div>
          <Link
            to="/profile"
            role="menuitem"
            className={menuItemClass}
            onClick={() => setOpen(false)}
          >
            Edit profile
          </Link>
          <Link
            to="/settings"
            role="menuitem"
            className={menuItemClass}
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className={menuDangerClass}
            onClick={() => {
              setOpen(false)
              logout()
              navigate('/')
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function DrawerProfileSection({
  user,
  onClose,
}: {
  user: AuthUser
  onClose: () => void
}) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
        <AvatarCircle user={user} className="h-11 w-11 text-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-xs text-neutral-500">{user.email}</p>
        </div>
      </div>
      <div className="flex flex-col overflow-hidden rounded-xl border border-white/10">
        <Link
          to="/profile"
          className="border-b border-white/10 px-4 py-3 text-sm font-medium text-neutral-200 transition hover:bg-white/5"
          onClick={onClose}
        >
          Edit profile
        </Link>
        <Link
          to="/settings"
          className="border-b border-white/10 px-4 py-3 text-sm font-medium text-neutral-200 transition hover:bg-white/5"
          onClick={onClose}
        >
          Settings
        </Link>
        <button
          type="button"
          className="px-4 py-3 text-left text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          onClick={() => {
            logout()
            onClose()
            navigate('/')
          }}
        >
          Log out
        </button>
      </div>
    </div>
  )
}
