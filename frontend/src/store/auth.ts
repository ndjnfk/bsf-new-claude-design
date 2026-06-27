import { create } from 'zustand'
import type { User } from '../lib/api'

// Auth state persisted to localStorage so a refresh keeps the session.
type AuthState = {
  token: string | null
  user: User | null
  isHelper: boolean
  permissions: string[]
  setSession: (token: string, user: User, isHelper?: boolean, permissions?: string[]) => void
  logout: () => void
}

const storedUser = (): User | null => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

const storedPerms = (): string[] => {
  try {
    const raw = localStorage.getItem('permissions')
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: storedUser(),
  isHelper: localStorage.getItem('isHelper') === '1',
  permissions: storedPerms(),
  setSession: (token, user, isHelper = false, permissions = []) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('isHelper', isHelper ? '1' : '0')
    localStorage.setItem('permissions', JSON.stringify(permissions))
    set({ token, user, isHelper, permissions })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isHelper')
    localStorage.removeItem('permissions')
    set({ token: null, user: null, isHelper: false, permissions: [] })
  },
}))
