import { create } from 'zustand'
import type { StaffUser } from '../types/staff'

const STORAGE_KEY = 'rsfg_staff'

type Stored = { token: string; staff: StaffUser }

type StaffAuthState = {
  token: string | null
  staff: StaffUser | null
  setAuth: (token: string, staff: StaffUser) => void
  logout: () => void
  initFromStorage: () => void
}

function persist(token: string, staff: StaffUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, staff } satisfies Stored))
}

export const useStaffAuthStore = create<StaffAuthState>((set) => ({
  token: null,
  staff: null,
  setAuth: (token, staff) => {
    persist(token, staff)
    set({ token, staff })
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, staff: null })
  },
  initFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<Stored>
      if (
        typeof parsed.token === 'string' &&
        parsed.staff &&
        typeof parsed.staff.id === 'string' &&
        (parsed.staff.role === 'admin' || parsed.staff.role === 'agent')
      ) {
        const staff = parsed.staff as StaffUser
        set({ token: parsed.token, staff })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  },
}))
