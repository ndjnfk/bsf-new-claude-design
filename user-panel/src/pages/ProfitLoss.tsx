import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table } from 'react-bootstrap'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../store/auth'
import { Loader } from '../components/common/Loader'
import { Pagination } from '../components/common/Pagination'
import { fetchProfitLoss, fetchProfitLossByMatch, fetchSportsList, type Meta, type Row } from '../services/reportsApi'
import { daysAgoApi, formatDayDate, todayApi } from '../utils/format'

const PER_PAGE = 10

// Profit/Loss: per-event settled P&L with a collapsible market drill-down
// (profitLossByMatch). Filter bar mirrors the Account Statement style — two dates,
// a sport dropdown and a green Search button — with the active sport shown as a
// pill below.
export default function ProfitLoss() {
  useDocumentTitle('Profit & Loss')
  const userId = useAuth((s) => s.user?.mstrid ?? '')

  const [sportId, setSportId] = useState(0)
  const [from, setFrom] = useState(daysAgoApi(10))
  const [to, setTo] = useState(todayApi())
  const [sports, setSports] = useState<Array<{ id: number; name: string }>>([])
  const [rows, setRows] = useState<Row[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, per_page: PER_PAGE })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, Row[] | 'loading'>>({})

  useEffect(() => {
    fetchSportsList().then((r) => setSports(r.data ?? [])).catch(() => setSports([]))
  }, [])

  const load = useCallback((p: number, sId: number, f: string, tt: string) => {
    setLoading(true)
    setError(false)
    setPage(p)
    setExpanded({})
    fetchProfitLoss({ page: p, sportId: sId, fromDate: f, toDate: tt })
      .then((res) => {
        setRows(res.data ?? [])
        setMeta(res.meta ?? { total: 0, per_page: PER_PAGE })
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(1, 0, daysAgoApi(10), todayApi())
  }, [load])

  const toggle = (match: Row) => {
    const key = String(match.matchId)
    if (expanded[key]) {
      setExpanded((e) => {
        const next = { ...e }
        delete next[key]
        return next
      })
      return
    }
    setExpanded((e) => ({ ...e, [key]: 'loading' }))
    fetchProfitLossByMatch({ matchId: Number(match.matchId), sportId, fromDate: from, toDate: to, userId })
      .then((res) => setExpanded((e) => ({ ...e, [key]: res.data ?? [] })))
      .catch(() => setExpanded((e) => ({ ...e, [key]: [] })))
  }

  const sign = (v: unknown) => (Number(v) > -1 ? 'text-primary' : 'text-danger')
  const activeSport = sportId === 0 ? 'All' : sports.find((s) => s.id === sportId)?.name ?? 'All'

  return (
    <div id="wrapper">
      <div className="container py-3 account-ui">
        <div className="row g-2 align-items-center justify-content-center account-filter mb-2">
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
          <div className="col-md-3 col-6">
            <select
              className="form-control"
              aria-label="Sport"
              value={sportId}
              onChange={(e) => setSportId(Number(e.target.value))}
            >
              <option value={0}>ALL</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2 col-6">
            <button
              type="button"
              className="btn btn-get waves-effect waves-light"
              onClick={() => load(1, sportId, from, to)}
            >
              Search
            </button>
          </div>
        </div>

        {/* Active sport pill (matches the reference layout). */}
        <div className="mb-3">
          <span
            style={{
              display: 'inline-block',
              background: '#2c3136',
              color: '#fff',
              padding: '6px 18px',
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            {activeSport}
          </span>
        </div>

        {loading ? (
          <Loader />
        ) : error ? (
          <p className="text-center text-danger py-4">Failed to load profit/loss.</p>
        ) : (
          <>
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <Table striped bordered hover size="sm" className="mb-0" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>Settled Date</th>
                    <th>Event Id</th>
                    <th>Event Name</th>
                    <th>Profit / Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((profit, i) => {
                    const key = String(profit.matchId)
                    const inner = expanded[key]
                    return (
                      <Fragment key={`m-${i}`}>
                        <tr role="button" onClick={() => toggle(profit)}>
                          <td>{formatDayDate(String(profit.settle_date ?? ''))}</td>
                          <td>{String(profit.matchId ?? '')}</td>
                          <td style={{ textDecoration: 'underline' }}>{String(profit.EventName ?? '')}</td>
                          <td className={sign(profit.PnL)}>{String(profit.PnL ?? '')}</td>
                        </tr>
                        {inner ? (
                          <tr>
                            <td colSpan={4} className="p-0">
                              {inner === 'loading' ? (
                                <Loader />
                              ) : (
                                <Table size="sm" className="mb-0">
                                  <thead>
                                    <tr>
                                      <th>Sno</th>
                                      <th>Market Name</th>
                                      <th>P_L</th>
                                      <th>Comm</th>
                                      <th>Created On</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inner.map((m, j) => (
                                      <tr key={j}>
                                        <td>{j + 1}</td>
                                        <td>{String(m.MarketName ?? '')}</td>
                                        <td className={Number(m.PnL) < 0 ? 'text-danger' : 'text-success'}>{String(m.PnL ?? '')}</td>
                                        <td className={Number(m.Comm) < 0 ? 'text-danger' : 'text-success'}>{String(m.Comm ?? '')}</td>
                                        <td>{formatDayDate(String(m.MstDate ?? ''))}</td>
                                        <td>
                                          <Link
                                            to={`/bet-history?matchId=${m.matchId}&marketId=${m.MarketId}&fancyId=${m.fancyId ?? ''}&type=pl`}
                                          >
                                            View
                                          </Link>
                                        </td>
                                      </tr>
                                    ))}
                                    {inner.length === 0 ? (
                                      <tr>
                                        <td colSpan={6} className="text-center">
                                          No Data Available
                                        </td>
                                      </tr>
                                    ) : null}
                                  </tbody>
                                </Table>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    )
                  })}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center">
                        Data not available
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </Table>
            </div>
            <Pagination
              page={page}
              total={meta.total ?? 0}
              perPage={meta.per_page ?? PER_PAGE}
              onChange={(p) => load(p, sportId, from, to)}
            />
          </>
        )}
      </div>
    </div>
  )
}
