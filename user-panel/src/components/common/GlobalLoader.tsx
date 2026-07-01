import { Spinner } from 'react-bootstrap'
import { useLoader } from '../../store/loader'

// Full-screen overlay spinner driven by the loader store (Angular LoaderService).
export function GlobalLoader() {
  const visible = useLoader((s) => s.visible)
  if (!visible) return null
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(0,0,0,0.3)', zIndex: 2000 }}
      role="status"
      aria-label="Loading"
    >
      <Spinner animation="border" variant="light" />
    </div>
  )
}
