import { Spinner } from 'react-bootstrap'

// Centered loading spinner used while data/route content is in flight.
export function Loader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
      <Spinner animation="border" role="status" />
      <span className="mt-2 small">{label}</span>
    </div>
  )
}
