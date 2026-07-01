import { useEffect, useRef } from 'react'
import { AppRoutes } from './routes/AppRoutes'
import { Loader } from './components/common/Loader'
import { useAuth } from './store/auth'
import { setUnauthorizedHandler } from './api/client'

// Root component. Runs the one-time app initialization (Angular APP_INITIALIZER →
// ApiService.init()) and gates rendering on it, so routes only mount once the
// session has been restored. Providers (Router, Toast) live in main.tsx.
export function App() {
  const status = useAuth((s) => s.status)
  const init = useAuth((s) => s.init)
  const started = useRef(false)

  useEffect(() => {
    // On a real 401, clear the session in-app (React Router then redirects to the
    // login page) — no hard reload, so the session probe can't loop.
    setUnauthorizedHandler(() => useAuth.getState().logout())
    if (started.current) return // guard StrictMode's double-invoke
    started.current = true
    void init()
  }, [init])

  if (status !== 'ready') return <Loader label="Starting…" />
  return <AppRoutes />
}
