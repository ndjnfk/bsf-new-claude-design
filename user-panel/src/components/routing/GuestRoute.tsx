import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../store/auth'

// Keeps already-authenticated users out of the login/register pages, sending them
// to the user-home hub instead (static — renders without other backend endpoints).
export function GuestRoute() {
  const isAuth = useAuth((s) => !!s.user)
  if (isAuth) return <Navigate to="/userhome" replace />
  return <Outlet />
}
