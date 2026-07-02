import { useState } from 'react'
import { getFancyStatus, getLimits } from '../../utils/eventCalc'
import type { CompanyLimit, Fancy, FancyLimit } from '../../services/bettingApi'

type Tab = 'All' | 'Session' | 'Result Waiting'
const TABS: Tab[] = ['All', 'Session', 'Result Waiting']

// Session sub-tabs, keyed by the fancy's in_priority (Over Runs=1, Player Run=2,
// Wicket=3, Others=4). Order mirrors the reference layout.
const SESSION_TABS: Array<{ name: string; value: number | '' }> = [
  { name: 'All', value: '' },
  { name: 'Over Runs', value: 1 },
  { name: 'Wicket', value: 3 },
  { name: 'Player Run', value: 2 },
  { name: 'Others', value: 4 },
]

// A fancy is "result awaiting" once its market closes with no result yet — the
// socket flags this (hasResult / status), so the Result Waiting tab lists them.
function isResultAwaiting(f: Fancy): boolean {
  return Boolean(f.hasResult) || String(f.status ?? '') === 'Result Awaiting'
}

// Fancy / session markets table — SELECTION | No | RATE | Yes | RATE | P.
//  • All: bettable fancies.
//  • Session: bettable fancies with sub-tabs by priority (Over Runs / Wicket / …).
//  • Result Waiting: fancies whose result is not yet declared.
// No (orange) and Yes (blue) open the bet slip; a suspended fancy shows a SUSPENDED
// banner and a result-awaiting one shows "Result Awaiting" across the price columns.
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
  const [sessionTab, setSessionTab] = useState<number | ''>('')
  if (fancies.length === 0) return null

  let rows: Fancy[]
  if (tab === 'Result Waiting') {
    rows = fancies.filter(isResultAwaiting)
  } else if (tab === 'Session') {
    rows = fancies.filter((f) => Number(f.is_indian_fancy) === 1 && !isResultAwaiting(f))
    if (sessionTab !== '') rows = rows.filter((f) => Number(f.in_priority) === Number(sessionTab))
  } else {
    rows = fancies.filter((f) => !isResultAwaiting(f))
  }

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
          {tab === 'Session' ? (
            <div className="fancy-tabs fancy-subtabs d-flex mt-2">
              {SESSION_TABS.map((st) => (
                <button
                  key={st.name}
                  type="button"
                  className={`fancy-tab ${sessionTab === st.value ? 'active' : ''}`}
                  onClick={() => setSessionTab(st.value)}
                >
                  {st.name}
                </button>
              ))}
            </div>
          ) : null}
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
              const awaiting = isResultAwaiting(fancy)
              const status = getFancyStatus(fancy)
              const suspended = !awaiting && status !== 'OPEN' && status !== ''
              const limits = getLimits(fancy, companyLimit, fancyLimits)
              return (
                <tr key={String(fancy.ID)} className="fancy-row">
                  <td className="evt-runner fancy-selection">
                    <span className="fancy-name">{fancy.HeadName}</span>
                    <span className="fancy-info" title={`Min: ${limits.min} | Max: ${limits.max}`}>
                      i
                    </span>
                  </td>
                  {awaiting ? (
                    <td className="evt-suspended-cell fancy-result-awaiting" colSpan={4}>
                      Result Awaiting
                    </td>
                  ) : suspended ? (
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-3">
                  No fancies
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
