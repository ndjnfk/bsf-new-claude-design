import { useState } from 'react'
import { getFancyStatus, getLimits } from '../../utils/eventCalc'
import type { CompanyLimit, Fancy, FancyLimit } from '../../services/bettingApi'

type Tab = 'All' | 'Session' | 'Result Waiting'
const TABS: Tab[] = ['All', 'Session', 'Result Waiting']

function inTab(fancy: Fancy, tab: Tab): boolean {
  if (tab === 'All') return true
  return String(fancy.Remarks ?? '') === 'INDIAN_SESSION_FANCY'
}

// Fancy / session markets table — SELECTION | No | RATE | Yes | RATE | P, with the
// All / Session / Result Waiting tabs. No (orange) and Yes (blue) open the bet slip;
// a suspended fancy shows a SUSPENDED banner across the price columns.
export function FancyTable({
  fancies,
  fancyLimits,
  companyLimit,
  onSelect,
}: {
  fancies: Fancy[]
  fancyLimits: FancyLimit[]
  companyLimit?: CompanyLimit | null
  onSelect: (fancy: Fancy, side: 'back' | 'lay') => void
}) {
  const [tab, setTab] = useState<Tab>('All')
  if (fancies.length === 0) return null
  const rows = fancies.filter((f) => inTab(f, tab))

  return (
    <div className="event-market fancy-market mb-3">
      <div className="event-market-head fancy-head d-flex justify-content-between align-items-start">
        <div>
          <span className="evt-name d-block mb-2">Fancy Markets</span>
          <div className="fancy-tabs d-flex">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                className={`fancy-tab ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <span className="fancy-count">0</span>
      </div>

      <div className="table-responsive">
        <table className="event-market-table fancy-table">
          <thead>
            <tr>
              <th className="evt-th-runner">SELECTION</th>
              <th>No</th>
              <th>RATE</th>
              <th>Yes</th>
              <th>RATE</th>
              <th className="fancy-p-col">P</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((fancy) => {
              const status = getFancyStatus(fancy)
              const suspended = status !== 'OPEN' && status !== ''
              const limits = getLimits(fancy, companyLimit, fancyLimits)
              return (
                <tr key={String(fancy.ID)} className="fancy-row">
                  <td className="evt-runner fancy-selection">
                    <span className="fancy-name">{fancy.HeadName}</span>
                    <span className="fancy-info" title={`Min: ${limits.min} | Max: ${limits.max}`}>
                      i
                    </span>
                  </td>
                  {suspended ? (
                    <td className="evt-suspended-cell" colSpan={4}>
                      {status || 'SUSPENDED'}
                    </td>
                  ) : (
                    <>
                      <td className="evt-khai fancy-no" role="button" tabIndex={0} onClick={() => onSelect(fancy, 'lay')}>
                        {fancy.SessInptNo ?? '--'}
                      </td>
                      <td className="fancy-rate">{fancy.NoValume ?? ''}</td>
                      <td className="evt-lagai fancy-yes" role="button" tabIndex={0} onClick={() => onSelect(fancy, 'back')}>
                        {fancy.SessInptYes ?? '--'}
                      </td>
                      <td className="fancy-rate">{fancy.YesValume ?? ''}</td>
                    </>
                  )}
                  <td className="fancy-p-col">
                    <svg className="fancy-ladder" width="16" height="16" viewBox="0 0 16 16" aria-label="ladder">
                      <rect x="3" y="1" width="2" height="14" fill="currentColor" />
                      <rect x="11" y="1" width="2" height="14" fill="currentColor" />
                      <rect x="3" y="3" width="10" height="1.5" fill="currentColor" />
                      <rect x="3" y="7" width="10" height="1.5" fill="currentColor" />
                      <rect x="3" y="11" width="10" height="1.5" fill="currentColor" />
                    </svg>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
