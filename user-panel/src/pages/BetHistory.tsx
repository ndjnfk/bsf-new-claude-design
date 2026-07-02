import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table } from 'react-bootstrap'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Loader } from '../components/common/Loader'
import { Pagination } from '../components/common/Pagination'
import { fetchBetHistory, fetchBetHistoryFilter, type Meta, type Row } from '../services/reportsApi'
import { daysAgoApi, formatDayDate, todayApi } from '../utils/format'

const STATUS_OPTIONS = [
  { value: 'M', label: 'MATCHED' },
  { value: 'P', label: 'PAST' },
]
const PER_PAGE = 10

// Bet History. Filters: date range + status (MATCHED = current/open, PAST = old/
// settled). When opened with ?matchId&type=pl (drill-down) it uses betHistoryFilter
// and hides the filter bar.
export default function BetHistory() {
  useDocumentTitle('Bet History')
  const [params] = useSearchParams()
  const drill = params.get('type') === 'pl'
  const matchId = params.get('matchId') ?? ''
  const marketId = params.get('marketId') ?? ''
  const fancyId = params.get('fancyId') ?? ''

  const [status, setStatus] = useState('M')
  const [from, setFrom] = useState(daysAgoApi(10))
  const [to, setTo] = useState(todayApi())
  const [rows, setRows] = useState<Row[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, per_page: PER_PAGE })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(
    (p: number, st: string, f: string, tt: string) => {
      setLoading(true)
      setError(false)
      setPage(p)
      const req = drill
        ? fetchBetHistoryFilter({ match_id: matchId, market_id: marketId, fancy_id: fancyId }).then((r) => ({
            data: r.data?.data ?? [],
            meta: { total: (r.data?.data ?? []).length, per_page: PER_PAGE } as Meta,
          }))
        : fetchBetHistory({ page_no: p, sport_id: '', from_date: f, to_date: tt, bet_type: st, type: 1 }).then((r) => ({
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
    load(1, 'M', daysAgoApi(10), todayApi())
  }, [load])

  const perPage = meta.per_page ?? PER_PAGE

  return (
    <div id="wrapper">
      <div className="container py-3 account-ui">
        {!drill ? (
          <div className="row g-2 align-items-center justify-content-center account-filter mb-3">
            <div className="col-md-2 col-6">
              <input
                type="date"
                className="form-control"
                aria-label="From date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="col-md-2 col-6">
              <input
                type="date"
                className="form-control"
                aria-label="To date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="col-md-2 col-6">
              <input type="text" className="form-control" value="BET HISTORY" readOnly aria-label="Report" />
            </div>
            <div className="col-md-2 col-6">
              <select className="form-control" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 col-6">
              <button type="button" className="btn btn-get waves-effect waves-light" onClick={() => load(1, status, from, to)}>
                Search
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <Loader />
        ) : error ? (
          <p className="text-center text-danger py-4">Failed to load bet history.</p>
        ) : (
          <>
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <Table striped bordered hover size="sm" className="mb-0" style={{ minWidth: 720 }}>
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
            </div>
            {!drill ? (
              <Pagination
                page={page}
                total={meta.total ?? 0}
                perPage={perPage}
                onChange={(p) => load(p, status, from, to)}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
