import { useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useSports } from '../store/sports'
import { useMatchDashboard } from '../hooks/useMatchDashboard'
import { useHorseRaces } from '../hooks/useHorseRaces'
import { SportTabs } from '../components/sports/SportTabs'
import { MatchCard } from '../components/sports/MatchCard'
import { HorseRow } from '../components/sports/HorseRow'
import { Loader } from '../components/common/Loader'

// Home dashboard — sport tabs + match list, with the horse/greyhound variant for
// sport 7 / 4339. Sport tabs come from the sports store (filtered id <= 4); the
// active sport is read from the ?sport_id= query param (default '4').
export default function Home() {
  useDocumentTitle('Home')
  const [params] = useSearchParams()
  const sportId = params.get('sport_id') ?? '4'
  const isGreyhound = sportId === '4339' || sportId === '7'

  const sportItems = useSports((s) => s.sportMenu).filter((s) => s.id <= 4)
  const { matches, loading, error } = useMatchDashboard(sportId, !isGreyhound)
  const horse = useHorseRaces(sportId, isGreyhound)

  return (
    <div id="wrapper">
      <div className="content-page m-0">
        <div className="content">
          <div className="container">
            <div className="dashboard-tabs">
              <SportTabs items={sportItems} activeId={sportId} />

              <div id="tabs-collapse" className="tab-content p-1">
                {isGreyhound ? (
                  <>
                    <div className="filter-buttons py-2">
                      {horse.countryOptions.map((c) => (
                        <button
                          key={c}
                          className={`btn btn-sm me-2 ${horse.selectedCountry === c ? 'btn-warning' : 'btn-dark'}`}
                          onClick={() => horse.setSelectedCountry(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <div className="mb-2 home match-index-row">
                      {horse.loading ? <Loader /> : null}
                      {!horse.loading && horse.error ? (
                        <p className="text-center text-danger py-4">Failed to load races.</p>
                      ) : null}
                      {horse.horse
                        .filter((h) => !horse.selectedCountry || h.country_code === horse.selectedCountry)
                        .map((m) => (
                          <HorseRow key={String(m.matchid)} match={m} />
                        ))}
                      {!horse.loading && !horse.error && horse.horse.length === 0 ? (
                        <p className="text-center py-4">No Data Available</p>
                      ) : null}
                    </div>
                  </>
                ) : (
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
