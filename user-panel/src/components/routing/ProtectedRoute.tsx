import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../store/auth'

// React equivalent of Angular's AuthGuard (`!!api.user`). Unauthenticated users are
// sent to /login-m — preserving the original redirect target — with the attempted
// location stashed in state so login can return there.
export function ProtectedRoute() {
  const isAuth = useAuth((s) => !!s.user)
  const location = useLocation()
  if (!isAuth) return <Navigate to="/login-m" replace state={{ from: location }} />
  return <Outlet />
}
