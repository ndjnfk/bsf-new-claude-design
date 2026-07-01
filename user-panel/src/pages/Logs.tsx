import { useCallback, useEffect, useState } from 'react'
import { Table } from 'react-bootstrap'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../store/auth'
import { Loader } from '../components/common/Loader'
import { Pagination } from '../components/common/Pagination'
import { clearLiability, fetchLogs, type Row } from '../services/reportsApi'
import { formatMedium } from '../utils/format'

const HIDDEN_LOG_TYPES = [
  'Update Liability inside getLiability Ended',
  'Update Liability inside getLiability Started',
]

export default function Logs() {
  useDocumentTitle('Logs')
  const userId = useAuth((s) => s.user?.mstrid ?? '')
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback((p: number) => {
    setLoading(true)
    setError(false)
    setPage(p)
    fetchLogs(p)
      .then((res) => {
        setRows((res.data ?? []).filter((d) => !HIDDEN_LOG_TYPES.includes(String(d.logType))))
        setTotal(Number(res.total ?? 0))
        setPageSize(Number(res.pageSize ?? 10))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => load(1), [load])

  return (
    <div id="wrapper">
      <div className="container dashboard_content py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Logs</h5>
          <button className="btn btn-sm btn-outline-danger" onClick={() => void clearLiability(String(userId)).then(() => load(1))}>
            Clear Liability
          </button>
        </div>
        {loading ? (
          <Loader />
        ) : error ? (
          <p className="text-center text-danger py-4">Failed to load logs.</p>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Match Name</th>
                  <th>Market Name</th>
                  <th>Selection Name</th>
                  <th>Log Type</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Before Balance</th>
                  <th>After Balance</th>
                  <th>Before Liability</th>
                  <th>After Liability</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{String(d.matchName ?? '')}</td>
                    <td>{String(d.marketName ?? '')}</td>
                    <td>{String(d.selectionName ?? '')}</td>
                    <td>{String(d.logType ?? '')}</td>
                    <td>{String(d.type ?? '')}</td>
                    <td>{d.createdAt ? formatMedium(String(d.createdAt)) : ''}</td>
                    <td>{String(d.beforeBalance ?? '')}</td>
                    <td>{String(d.afterBalance ?? '')}</td>
                    <td>{String(d.beforeLiability ?? '')}</td>
                    <td>{String(d.afterLiability ?? '')}</td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center">
                      No Data Available
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
            <Pagination page={page} total={total} perPage={pageSize} onChange={load} />
          </div>
        )}
      </div>
    </div>
  )
}
