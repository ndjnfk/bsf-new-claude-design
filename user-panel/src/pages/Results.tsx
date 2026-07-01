import { useCallback, useEffect, useState } from 'react'
import { Table, Pagination } from 'react-bootstrap'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { fetchResults, fetchResultsSports, type ResultRow } from '../services/dashboardApi'
import { formatDateTime } from '../utils/format'

// Results — sport filter + date + paginated table. API params preserved exactly
// (results?sport_id=&date=&page=); the sport list filters out casino sports
// (77, 1233, 1234, 1235), as the Angular page did.
const HIDDEN_SPORTS = [77, 1233, 1234, 1235]

export default function Results() {
  useDocumentTitle('Results')
  const [sports, setSports] = useState<Array<{ id: number; name: string }>>([])
  const [rows, setRows] = useState<ResultRow[]>([])
  const [sportId, setSportId] = useState<number | string>(4)
  const [date, setDate] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, perPage: 70 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchResultsSports()
      .then((rs) => setSports((rs.data ?? []).filter((el) => !HIDDEN_SPORTS.includes(el.id))))
      .catch(() => setSports([]))
  }, [])

  // One fetch per action (no duplicate calls); explicit args avoid stale state.
  const runQuery = useCallback((sId: number | string, d: string, p: number) => {
    setLoading(true)
    setSportId(sId)
    setDate(d)
    setPage(p)
    fetchResults({ sport_id: sId, date: d, page: p })
      .then((rs) => {
        setRows(rs.data ?? [])
        setMeta({ total: rs.meta?.total ?? 0, perPage: rs.meta?.per_page ?? 70 })
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    runQuery(4, '', 1)
  }, [runQuery])

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.perPage))

  return (
    <div id="wrapper">
      <div className="container dashboard_content">
        <div className="w-100">
          <div className="row align-items-center">
            <div className="col-md-3 col-6 mb-sm-1">
              <input
                name="date"
                type="date"
                autoComplete="off"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="col-md-2 col-6 mb-sm-1">
              <button className="btn btn-success" onClick={() => runQuery(sportId, date, 1)}>
                Submit
              </button>
            </div>
          </div>

          <div className="btn-groups mt-4">
            {sports.map((s) => (
              <button
                key={s.id}
                className={`btn me-1 mb-1 ${String(sportId) === String(s.id) ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => runQuery(s.id, '', 1)}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="mt-4 table-responsive">
            <Table striped bordered>
              <thead>
                <tr role="row">
                  <th>ID</th>
                  <th>Match Name</th>
                  <th>Market Name</th>
                  <th>Date</th>
                  <th>Winner Name</th>
                  <th>Winner Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} role="row">
                    <td>{meta.perPage * (page - 1) + i + 1}</td>
                    <td>{r.MatchName ? r.MatchName.split(')')[0] + ')' : ''}</td>
                    <td>{r.MarketName}</td>
                    <td>{r.date ? formatDateTime(r.date) : ''}</td>
                    <td>{r.SelectionName}</td>
                    <td>{r.result}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {!loading && rows.length === 0 ? <p className="text-center">No Data Available</p> : null}

            <div className="text-center">
              <Pagination className="justify-content-center">
                <Pagination.Prev disabled={page <= 1} onClick={() => runQuery(sportId, date, page - 1)} />
                <Pagination.Item active>{`Page ${page} of ${totalPages}`}</Pagination.Item>
                <Pagination.Next disabled={page >= totalPages} onClick={() => runQuery(sportId, date, page + 1)} />
              </Pagination>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
