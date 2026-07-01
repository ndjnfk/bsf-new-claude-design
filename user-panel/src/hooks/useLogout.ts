import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout as apiLogout } from '../services/authApi'
import { useAuth } from '../store/auth'

// Logout flow matching ApiService.logout(): best-effort backend logout + socket and
// storage teardown, then clear React state and navigate to /login.
export function useLogout(): () => Promise<void> {
  const navigate = useNavigate()
  return useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      /* best-effort */
    }
    useAuth.getState().logout()
    navigate('/login')
  }, [navigate])
}
