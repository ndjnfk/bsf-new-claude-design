import { Link } from 'react-router-dom'

// Error / empty / invalid-param states for the event page. Messages are
// intentionally generic — no technical or sensitive API details are surfaced.

// EventLoadError shows a generic failure message with a retry action.
export function EventLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="container py-5 text-center">
      <p className="mb-3">We couldn’t load this event. Please try again.</p>
      <button type="button" className="btn btn-success" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

// EmptyMarkets is shown when the event has no markets to bet on.
export function EmptyMarkets() {
  return <p className="text-center py-5">No markets available for this event right now.</p>
}

// InvalidEventParams is the error page for a malformed /event/:eventId/:marketId/:sportId URL.
export function InvalidEventParams() {
  return (
    <div className="container py-5 text-center">
      <h5 className="mb-2">Invalid event</h5>
      <p className="mb-3">This event link is not valid.</p>
      <Link to="/home" className="btn btn-success">
        Back to Home
      </Link>
    </div>
  )
}
