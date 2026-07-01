import { Link } from 'react-router-dom'
import type { MatchRow } from '../../services/dashboardApi'

// A single match card (Angular home/in-play match row). Links to the event page and
// shows the name/series, bookmaker/fancy badges, bet counts, in-play state and date.
export function MatchCard({ match, showSession }: { match: MatchRow; showSession: boolean }) {
  const to = `/event/${match.matchid}/${match.marketid ?? match.matchid}/${match.sportid}`
  const date = match.MstDate ? new Date(match.MstDate) : null
  return (
    <div className="bg-martets">
      <Link to={to} title={match.matchName} className="text-decoration-none">
        <div className="row" style={{ paddingTop: 15 }}>
          <div className="col-xs-12 top-time-dtl in-play-right-box-color d-md-none">
            {date ? date.toLocaleString() : ''}
          </div>
          <div className="col-md-10 col-lg-10 col-sm-9 col-xs-12 in-play-row-left p-0">
            <div className="col-lg-12 match-detail-container" style={{ padding: 15 }}>
              <div className="match-title">
                <div className="d-flex">
                  <p className="team-name-font-color mb-2">
                    <span className="fw-bold">{match.matchName}</span>
                    <span className="d-block fs-11"> ({match.series_name}) </span>
                  </p>
                  <div className="market_active_icon mb-0 ms-auto">
                    {match.has_bookmaker === 1 ? <span className="game-bookmakers me-1">BM </span> : null}
                    {match.isfancy ? <span className="game-fancy">F</span> : null}
                  </div>
                </div>
                <div className="match-info">
                  <p className="mb-0">Match Bets - {match.match_bets_count}</p>
                  {showSession ? <p className="mb-0">Session Bets - {match.session_bets_count}</p> : null}
                </div>
                {match.inPlay ? (
                  <div className="d-flex justify-content-end">
                    <span className="inplay_txt blinking-inplay" style={{ fontWeight: 'bold', color: 'red' }}>
                      In-Play
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="col-md-2 col-lg-2 d-none d-md-block in-play-row-right in-play-right-box-color align-content-center">
            <div className="match-time-dtl">
              <p className="match-time-dtl-date">{date ? date.toLocaleDateString() : ''}</p>
              <p className="match-time-dtl-mounth">{date ? date.toLocaleTimeString() : ''}</p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
