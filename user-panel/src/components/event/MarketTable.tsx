import { marketSuspended, getStatus } from '../../utils/eventCalc'
import type { Market, Runner } from '../../services/bettingApi'

// One market block (Match Odds / Bookmaker / Toss / Tied Match) rendered as the
// RUNNER | LAGAI | KHAI | POSITION table of the Angular event page. Each runner's
// LAGAI (back) / KHAI (lay) cell opens the bet slip; a suspended runner shows a
// SUSPENDED banner spanning both price columns.
export function MarketTable({
  market,
  onSelect,
  positions,
}: {
  market: Market
  onSelect: (market: Market, runner: Runner, side: 'back' | 'lay') => void
  positions?: Record<string, number>
}) {
  const showCashout = market.market_name === 'Match Odds'
  const min = market.min_stack ?? 0
  const max = market.max_stack ?? 0
  const runners = market.runners ?? []

  return (
    <div className="event-market mb-3">
      <div className="event-market-head d-flex justify-content-between align-items-center">
        <span>
          <span className="evt-name">{market.market_name}</span>
          <span className="event-market-limits">
            Min : {min} | Max : {max}
          </span>
        </span>
        {showCashout ? (
          <button type="button" className="event-cashout">
            Cashout
          </button>
        ) : null}
      </div>

      <div className="table-responsive">
        <table className="event-market-table">
          <thead>
            <tr>
              <th className="evt-th-runner">RUNNER</th>
              <th>LAGAI</th>
              <th>KHAI</th>
              <th>POSITION</th>
            </tr>
          </thead>
          <tbody>
            {runners.map((runner) => {
              const suspended = marketSuspended(market, runner)
              const status = getStatus(market, runner)
              const pos = positions?.[String(runner.id)] ?? 0
              return (
                <tr key={String(runner.id)} className={suspended ? 'evt-row evt-suspended' : 'evt-row evt-active'}>
                  <td className="evt-runner">{runner.name}</td>
                  {suspended ? (
                    <td className="evt-suspended-cell" colSpan={2}>
                      {status || 'SUSPENDED'}
                    </td>
                  ) : (
                    <>
                      <td
                        className="evt-lagai"
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelect(market, runner, 'back')}
                      >
                        <div className="evt-price">{runner.back0?.price ?? ''}</div>
                        <div className="evt-size">{runner.back0?.size ?? ''}</div>
                      </td>
                      <td
                        className="evt-khai"
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelect(market, runner, 'lay')}
                      >
                        <div className="evt-price">{runner.lay0?.price ?? ''}</div>
                        <div className="evt-size">{runner.lay0?.size ?? ''}</div>
                      </td>
                    </>
                  )}
                  <td className="evt-position">{pos.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
