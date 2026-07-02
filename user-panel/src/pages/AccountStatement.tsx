import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Table } from 'react-bootstrap'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Loader } from '../components/common/Loader'
import { Pagination } from '../components/common/Pagination'
import { fetchAccountStatement, fetchLedger, type Meta, type Row } from '../services/reportsApi'
import { daysAgoApi, formatDate, todayApi } from '../utils/format'

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: '1', label: 'Ledger' },
  { value: '2', label: 'Commission' },
  { value: '4', label: 'Credit Limit' },
]
const PER_PAGE = 50

// Account statement (filters + ledger) and its /ledger alias (no filters, ledger
// endpoint). Date defaults: account 10 days, ledger 60 days.
export default function AccountStatement() {
  const location = useLocation()
  const showFilter = location.pathname !== '/ledger'
  useDocumentTitle(showFilter ? 'Account Statement' : 'Ledger')

  const [type, setType] = useState(showFilter ? 'all' : '1')
  const [from, setFrom] = useState(daysAgoApi(showFilter ? 10 : 60))
  const [to, setTo] = useState(todayApi())
  const [rows, setRows] = useState<Row[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, per_page: PER_PAGE })
  const [opening, setOpening] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(
    (p: number) => {
      setError(false)
      setPage(p)
      setLoading(true)
      // Statement page hits /api/user/accountStatement with the filter values; the
      // /ledger alias loads the (filter-less) ledger endpoint instead.
      const req = showFilter
        ? fetchAccountStatement({ page: p, type, from_date: from, to_date: to })
        : fetchLedger({ page: p })
      req
        .then((res) => {
          setRows(res.data ?? [])
          setMeta(res.meta ?? { total: 0, per_page: PER_PAGE })
          setOpening(Number(res.openingBalance ?? 0))
        })
        // On failure show the empty-state table ("There are no records to show"),
        // not a hard error banner.
        .catch(() => {
          setRows([])
          setMeta({ total: 0, per_page: PER_PAGE })
        })
        .finally(() => setLoading(false))
    },
    [showFilter, type, from, to],
  )

  useEffect(() => {
    load(1)
  }, [load])

  // Export the currently loaded statement rows to a CSV file (the download icon
  // in the filter bar). Mirrors the on-screen columns.
  const exportCsv = useCallback(() => {
    const header = ['Date', 'Entry', 'Debit', 'Credit', 'Balance']
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = rows.map((d) =>
      [
        formatDate(String(showFilter ? d.Sdate : d.modified_MstDate)),
        showFilter ? d.Narration : d.MatchName,
        d.Debit,
        d.Credit,
        showFilter ? d.balance : '',
      ]
        .map(esc)
        .join(','),
    )
    const csv = [header.map(esc).join(','), ...lines].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${showFilter ? 'account-statement' : 'ledger'}-${from}_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [rows, showFilter, from, to])

  return (
    <div id="wrapper">
      <div className="container py-3 account-ui">
        {/* <h5 className="mb-3">{showFilter ? 'Account Statement' : 'Ledger'}</h5> */}

        {showFilter ? (
          <div className="row g-2 align-items-center justify-content-stratch account-filter mb-3">
            <div className="col-md-2 col-6 mb-sm-1">
              <input
                name="date"
                type="date"
                autoComplete="off"
                placeholder="Select Date"
                aria-label="From date"
                className="form-control"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="col-md-2 col-6 mb-sm-1">
              <input
                name="date"
                type="date"
                autoComplete="off"
                placeholder="Select Date"
                aria-label="To date"
                className="form-control"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="col-md-2 col-6 mb-sm-1">
              <div className="input-group">
                <select
                  className="form-control"
                  aria-label="Type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <div className="input-group-append p-0">
                  <button type="button" className="btn-download h-100" aria-label="Download CSV" onClick={exportCsv}>
                    <img src="/assets/image/cloud.png" width="24" alt="Download" />
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-sm-1">
              <button type="button" className="btn btn-get waves-effect waves-light" onClick={() => load(1)}>
                Search
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <Loader />
        ) : error ? (
          <p className="text-center text-danger py-4">Failed to load statement.</p>
        ) : (
          <>
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <Table striped bordered hover size="sm" className="mb-0" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Entry</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  {showFilter ? <th>Balance</th> : null}
                </tr>
              </thead>
              <tbody>
                {showFilter ? (
                  <tr>
                    <td />
                    <td />
                    <td>Opening balance</td>
                    <td />
                    <td>{opening}</td>
                  </tr>
                ) : null}
                {rows.map((d, i) => (
                  <tr key={i}>
                    <td>{formatDate(String(showFilter ? d.Sdate : d.modified_MstDate))}</td>
                    <td>
                      {showFilter ? (
                        d.matchId ? (
                          <Link to={`/bet-history?matchId=${d.matchId}&type=pl`}>{String(d.Narration ?? '')}</Link>
                        ) : (
                          String(d.Narration ?? '')
                        )
                      ) : (
                        <Link to={`/ledger/${d.matchid}`}>{String(d.MatchName ?? '')}</Link>
                      )}
                    </td>
                    <td className="debit">{String(d.Debit ?? '')}</td>
                    <td className="credit">{String(d.Credit ?? '')}</td>
                    {showFilter ? <td>{String(d.balance ?? '')}</td> : null}
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={showFilter ? 5 : 4} className="text-center">
                      There are no records to show
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
              onChange={(p) => load(p)}
            />
          </>
        )}
      </div>
    </div>
  )
}
