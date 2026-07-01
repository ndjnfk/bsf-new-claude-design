import { Link } from 'react-router-dom'
import type { MatchRow } from '../../services/dashboardApi'

// A horse/greyhound race row with its per-market time buttons (Angular home).
export function HorseRow({ match }: { match: MatchRow }) {
  const date = match.MstDate ? new Date(match.MstDate) : null
  return (
    <div className="bg-martets bg-hourse_martets">
      <div className="row market-data mx-0 text-capitalize py-2 sport-list">
        <div className="col-md-4 col-8 align-self-center">
          <div className="team-name mb-2 my-lg-2">
            <span className="tn-icons">
              <i className="mdi mdi-timer-outline" />
            </span>
            <div className="lh-13">
              <p className="match_name mb-0">{match.matchName}</p>
              <small className="mb-0 series_name">{date ? date.toLocaleDateString() : ''}</small>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-12 ms-auto align-self-center mx-0 px-lg-0">
          {(match.times ?? []).map((m) => (
            <Link key={m.marketId} to={`/event/${match.matchid}/${m.marketId}/${match.sportid}`} className="whitebk btn">
              {new Date(m.time).toLocaleTimeString()}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
