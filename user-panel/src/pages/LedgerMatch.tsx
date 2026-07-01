import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Table } from 'react-bootstrap'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Loader } from '../components/common/Loader'
import { fetchLedgerByMatch, type LedgerMatchResponse, type Row } from '../services/reportsApi'

// One match-odds-style section (Match Toss / Match Odds / Bookmaker / Goals / Tied).
function BetSection({ title, rows, finalValue }: { title: string; rows: Row[]; finalValue?: number }) {
  if (!rows || rows.length === 0) return null
  return (
    <div className="mb-3">
      <h6 className="mb-1">{title}</h6>
      <div className="table-responsive">
        <Table striped bordered size="sm" className="mb-1">
          <thead>
            <tr>
              <th>Rate</th>
              <th>Amt.</th>
              <th>Mode</th>
              <th>Team</th>
              <th>Result</th>
              <th>P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d, i) => {
              const pl = Number(d.Profit ?? 0) - Number(d.Liability ?? 0)
              return (
                <tr key={i}>
                  <td>{String(d.Odds ?? '')}</td>
                  <td>{String(d.Stack ?? '')}</td>
                  <td>{String(d.Type ?? '')}</td>
                  <td>{String(d.selectionName ?? '')}</td>
                  <td>{String(d.winner ?? '')}</td>
                  <td className={pl > -1 ? 'text-success' : 'text-danger'}>{pl}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </div>
      {finalValue !== undefined ? (
        <p className={`mb-0 ${finalValue > -1 ? 'text-success' : 'text-danger'}`}>
          You {finalValue > -1 ? 'Won' : 'Lost'} {finalValue}/- Coins.
        </p>
      ) : null}
    </div>
  )
}

// Route: ledger/:matchid — per-match P/L breakdown by bet type + totals.
export default function LedgerMatch() {
  const { matchid = '' } = useParams()
  useDocumentTitle('Match Ledger')
  const [data, setData] = useState<LedgerMatchResponse>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    fetchLedgerByMatch(matchid)
      .then((res) => {
        if (active) setData(res)
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [matchid])

  if (loading) return <Loader />
  if (error) return <p className="text-center text-danger py-4">Failed to load ledger.</p>

  const totalPlusMinus =
    Number(data.matchOddsFinalValue ?? 0) +
    Number(data.matchTossFinalValue ?? 0) +
    Number(data.bookmakerOddsFinalValue ?? 0) +
    Number(data.tiedMatchFinalValue ?? 0) +
    Number(data.fancyFinalValue ?? 0) +
    Number(data.goalFinalValue ?? 0)
  const commission = Number(data.commission ?? 0)
  const net = totalPlusMinus + commission

  return (
    <div id="wrapper">
      <div className="container dashboard_content py-3">
        <h5 className="mb-3">Match Ledger</h5>

        <BetSection title="Match Toss Bets" rows={data.matchToss ?? []} finalValue={data.matchTossFinalValue} />
        <BetSection title="Match Winner Market Bets" rows={data.matchodds ?? []} finalValue={data.matchOddsFinalValue} />
        <BetSection title="Bookmaker" rows={data.bookmakerodds ?? []} finalValue={data.bookmakerOddsFinalValue} />
        <BetSection title="Over/Under Goals" rows={data.goalBets ?? []} finalValue={data.goalFinalValue} />
        <BetSection title="Tied Match" rows={data.tiedMatch ?? []} finalValue={data.tiedMatchFinalValue} />

        {data.fancy && data.fancy.length > 0 ? (
          <div className="mb-3">
            <h6 className="mb-1">Fancy Bets</h6>
            <div className="table-responsive">
              <Table striped bordered size="sm" className="mb-1">
                <thead>
                  <tr>
                    <th>Fancy</th>
                    <th>Runs</th>
                    <th>Rate</th>
                    <th>Amt.</th>
                    <th>Mode</th>
                    <th>Result</th>
                    <th>P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fancy.map((d, i) => {
                    const pl = Number(d.Profit) > 0 ? Number(d.Profit) : Number(d.Liability)
                    return (
                      <tr key={i}>
                        <td>{String(d.Fancy ?? '')}</td>
                        <td>{String(d.Runs ?? '')}</td>
                        <td>{String(d.Rate ?? '')}</td>
                        <td>{String(d.Amt ?? '')}</td>
                        <td>{String(d.Mode ?? '')}</td>
                        <td>{String(d.Result ?? '')}</td>
                        <td className={pl > -1 ? 'text-success' : 'text-danger'}>{pl}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
            <p className={`mb-0 ${Number(data.fancyFinalValue ?? 0) > -1 ? 'text-success' : 'text-danger'}`}>
              You {Number(data.fancyFinalValue ?? 0) > -1 ? 'Won' : 'Lost'} {data.fancyFinalValue ?? 0}/- Coins.
            </p>
          </div>
        ) : null}

        <Table bordered size="sm" className="mt-3" style={{ maxWidth: 420 }}>
          <tbody>
            <tr>
              <td>Match Plus Minus</td>
              <td className={totalPlusMinus > -1 ? 'text-success' : 'text-danger'}>{totalPlusMinus}</td>
            </tr>
            <tr>
              <td>My Commission</td>
              <td>{commission}</td>
            </tr>
            <tr>
              <td>Mob. App. Charges</td>
              <td>0</td>
            </tr>
            <tr>
              <td>Net Plus Minus</td>
              <td className={net > -1 ? 'text-success' : 'text-danger'}>{net}</td>
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  )
}
