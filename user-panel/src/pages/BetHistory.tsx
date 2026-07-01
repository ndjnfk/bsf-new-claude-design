import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table } from 'react-bootstrap'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Loader } from '../components/common/Loader'
import { Pagination } from '../components/common/Pagination'
import { fetchBetHistory, fetchBetHistoryFilter, fetchSportsList, type Meta, type Row } from '../services/reportsApi'
import { daysAgoApi, formatDayDate, todayApi } from '../utils/format'

const STATUS_OPTIONS = [
  { value: 'M', label: 'MATCHED' },
  { value: 'P', label: 'PAST' },
]
const PER_PAGE = 10

// Bet history. When opened with ?matchId/&type=pl (drill-down), it uses
// betHistoryFilter and hides the filter bar; otherwise betHistory with filters.
export default function BetHistory() {
  useDocumentTitle('Bet History')
  const [params] = useSearchParams()
  const drill = params.get('type') === 'pl'
  const matchId = params.get('matchId') ?? ''
  const marketId = params.get('marketId') ?? ''
  const fancyId = params.get('fancyId') ?? ''

  const [sportId, setSportId] = useState('4')
  const [status, setStatus] = useState('M')
  const [from, setFrom] = useState(daysAgoApi(10))
  const [to, setTo] = useState(todayApi())
  const [sports, setSports] = useState<Array<{ id: number; name: string }>>([])
  const [rows, setRows] = useState<Row[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, per_page: PER_PAGE })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!drill) fetchSportsList().then((r) => setSports(r.data ?? [])).catch(() => setSports([]))
  }, [drill])

  const load = useCallback(
    (p: number, sId: string, st: string, f: string, tt: string) => {
      setLoading(true)
      setError(false)
      setPage(p)
      const req = drill
        ? fetchBetHistoryFilter({ match_id: matchId, market_id: marketId, fancy_id: fancyId }).then((r) => ({
            data: r.data?.data ?? [],
            meta: { total: (r.data?.data ?? []).length, per_page: PER_PAGE } as Meta,
          }))
        : fetchBetHistory({ page_no: p, sport_id: sId, from_date: f, to_date: tt, bet_type: st, type: 1 }).then((r) => ({
            data: r.data?.data ?? [],
            meta: r.data?.meta ?? { total: 0, per_page: PER_PAGE },
          }))
      req
        .then((res) => {
          setRows(res.data)
          setMeta(res.meta)
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    },
    [drill, matchId, marketId, fancyId],
  )

  useEffect(() => {
    load(1, '4', 'M', daysAgoApi(10), todayApi())
  }, [load])

  return (
    <div id="wrapper">
      <div className="container dashboard_content py-3">
        <h5 className="mb-3">Bet History</h5>

        {!drill ? (
          <div className="row g-2 align-items-end mb-3">
            <div className="col-md-3 col-6">
              <label className="form-label">Sport</label>
              <select className="form-select" value={sportId} onChange={(e) => setSportId(e.target.value)}>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 col-6">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 col-6">
              <label className="form-label">From</label>
              <input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="col-md-2 col-6">
              <label className="form-label">To</label>
              <input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="col-md-2 col-6">
              <button className="btn btn-success w-100" onClick={() => load(1, sportId, status, from, to)}>
                Submit
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <Loader />
        ) : error ? (
          <p className="text-center text-danger py-4">Failed to load bet history.</p>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Side</th>
                  <th>Price</th>
                  <th>Stake</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((bat, i) => (
                  <tr key={i} className={bat.Type === 'Back' ? 'back' : 'lay'}>
                    <td>{String(bat.Description ?? '')}</td>
                    <td>{bat.Type === 'Back' ? 'LAGAI' : 'KHAI'}</td>
                    <td>{String(bat.Odds ?? '')}</td>
                    <td>{String(bat.Stack ?? '')}</td>
                    <td>{formatDayDate(String(bat.MatchedDate ?? bat.MstDate ?? ''))}</td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      No Data Available
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
            {!drill ? (
              <Pagination
                page={page}
                total={meta.total ?? 0}
                perPage={meta.per_page ?? PER_PAGE}
                onChange={(p) => load(p, sportId, status, from, to)}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
