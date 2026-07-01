import { useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMatchDashboard } from '../hooks/useMatchDashboard'
import { SportTabs } from '../components/sports/SportTabs'
import { MatchCard } from '../components/sports/MatchCard'
import { Loader } from '../components/common/Loader'
import type { SportMenuItem } from '../types'

// In-Play dashboard. Sport list is hard-coded (Cricket/Tennis/Soccer), exactly as the
// Angular InPlayComponent; the active sport comes from ?sport_id= (default '4').
const SPORTS: SportMenuItem[] = [
  { id: 4, name: 'Cricket', image: '/assets/image/cricket.png', url: '/in-play', qr: { sport_id: 4 } },
  { id: 2, name: 'Tennis', image: '/assets/image/tennis.png', url: '/in-play', qr: { sport_id: 2 } },
  { id: 1, name: 'Soccer', image: '/assets/image/soccer.png', url: '/in-play', qr: { sport_id: 1 } },
]

export default function InPlay() {
  useDocumentTitle('In-Play')
  const [params] = useSearchParams()
  const sportId = params.get('sport_id') ?? '4'
  const { matches, loading, error } = useMatchDashboard(sportId)

  return (
    <div id="wrapper">
      <div className="content-page m-0">
        <div className="content">
          <div className="container">
            <div className="dashboard-tabs">
              <SportTabs items={SPORTS} activeId={sportId} />
              <div className="tab-content p-1">
                <div className="mb-2 home match-index-row">
                  {loading ? <Loader /> : null}
                  {!loading && error ? <p className="text-center text-danger py-4">Failed to load matches.</p> : null}
                  {!loading && !error && matches.length === 0 ? (
                    <p className="text-center py-4">No Data Available</p>
                  ) : null}
                  {matches.map((m) => (
                    <MatchCard key={String(m.matchid)} match={m} showSession={String(sportId) === '4'} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
