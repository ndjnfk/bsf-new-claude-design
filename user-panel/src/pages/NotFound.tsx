import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

// Catch-all 404 for unknown URLs (Angular had no catch-all route).
export default function NotFound() {
  useDocumentTitle('Not Found')
  return (
    <div className="container py-5 text-center">
      <h1 className="display-6 mb-2">404</h1>
      <p className="text-muted">Page not found.</p>
      <Link to="/login-m" className="btn btn-primary btn-sm">
        Go to start
      </Link>
    </div>
  )
}
