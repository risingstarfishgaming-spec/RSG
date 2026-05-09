import { create } from 'zustand'
import type { AuthUser } from '../types/auth'

const STORAGE_KEY = 'rsfg_auth'

type StoredAuth = { token: string; user: AuthUser }

type AuthState = {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
  initFromStorage: () => void
  setUser: (user: AuthUser) => void
}

function persist(token: string, user: AuthUser) {
  const data: StoredAuth = { token, user }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  setAuth: (token, user) => {
    persist(token, user)
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, user: null })
  },
  initFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<StoredAuth>
      if (
        typeof parsed.token === 'string' &&
        parsed.user &&
        typeof parsed.user.id === 'string'
      ) {
        set({ token: parsed.token, user: parsed.user as AuthUser })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  },
  setUser: (user) => {
    const { token } = get()
    if (!token) return
    persist(token, user)
    set({ user })
  },
}))
