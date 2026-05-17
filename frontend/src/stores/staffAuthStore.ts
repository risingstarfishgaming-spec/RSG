import { create } from 'zustand'
import type { StaffRole, StaffUser } from '../types/staff'

const LEGACY_STORAGE_KEY = 'rsfg_staff'
const STORAGE_KEYS: Record<StaffRole, string> = {
  admin: 'rsfg_staff_admin',
  agent: 'rsfg_staff_agent',
}

type StaffSession = { token: string; staff: StaffUser }

type StaffAuthState = {
  admin: StaffSession | null
  agent: StaffSession | null
  setAuth: (token: string, staff: StaffUser) => void
  logout: (role: StaffRole) => void
  initFromStorage: () => void
}

function isValidSession(raw: unknown): raw is StaffSession {
  if (!raw || typeof raw !== 'object') return false
  const o = raw as Partial<StaffSession>
  return (
    typeof o.token === 'string' &&
    !!o.staff &&
    typeof o.staff.id === 'string' &&
    (o.staff.role === 'admin' || o.staff.role === 'agent')
  )
}

function readSession(role: StaffRole): StaffSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[role])
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isValidSession(parsed) || parsed.staff.role !== role) {
      localStorage.removeItem(STORAGE_KEYS[role])
      return null
    }
    return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEYS[role])
    return null
  }
}

function writeSession(role: StaffRole, session: StaffSession) {
  localStorage.setItem(STORAGE_KEYS[role], JSON.stringify(session))
}

function clearSession(role: StaffRole) {
  localStorage.removeItem(STORAGE_KEYS[role])
}

/** One-time migration from single-key storage to per-role keys. */
function migrateLegacyStorage() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as unknown
    if (!isValidSession(parsed)) {
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      return
    }
    const role = parsed.staff.role
    if (!readSession(role)) {
      writeSession(role, parsed)
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  }
}

export const useStaffAuthStore = create<StaffAuthState>((set) => ({
  admin: null,
  agent: null,
  setAuth: (token, staff) => {
    const role = staff.role
    const session: StaffSession = { token, staff }
    writeSession(role, session)
    set((state) => ({ ...state, [role]: session }))
  },
  logout: (role) => {
    clearSession(role)
    set((state) => ({ ...state, [role]: null }))
  },
  initFromStorage: () => {
    migrateLegacyStorage()
    set({
      admin: readSession('admin'),
      agent: readSession('agent'),
    })
  },
}))

/** Admin and agent sessions are stored separately so both can stay signed in. */
export function useStaffSession(role: StaffRole) {
  const session = useStaffAuthStore((s) => (role === 'admin' ? s.admin : s.agent))
  const logout = useStaffAuthStore((s) => s.logout)
  return {
    token: session?.token ?? null,
    staff: session?.staff ?? null,
    logout: () => logout(role),
  }
}
