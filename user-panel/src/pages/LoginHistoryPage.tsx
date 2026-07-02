import { useCallback, useEffect, useState } from 'react'
import { Table } from 'react-bootstrap'
import { Header } from '../components/layout/Header'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Loader } from '../components/common/Loader'
import { Pagination } from '../components/common/Pagination'
import { fetchLoginHistory, type Meta, type Row } from '../services/reportsApi'
import { formatMedium } from '../utils/format'
import './LoginHistoryPage.scss'

// Login History — the Player's own login records. Renders the shared Header, then
// the table (as the reference: blue header, white striped rows). Data comes from
// GET /loginHistory?page=N via the existing authenticated API client.
export default function LoginHistoryPage() {
  useDocumentTitle('Login History')
  const [rows, setRows] = useState<Row[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, per_page: 10 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback((p: number) => {
    setLoading(true)
    setError(false)
    setPage(p)
    fetchLoginHistory(p)
      .then((res) => {
        setRows(res.data ?? [])
        setMeta(res.meta ?? { total: 0, per_page: 10 })
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => load(1), [load])

  const perPage = meta.per_page ?? 10

  return (
    <div className="login-history-page">
      <Header />
      <div className="container py-3">
        {loading ? (
          <Loader />
        ) : error ? (
          <p className="text-center text-danger py-4">Failed to load login history.</p>
        ) : (
          <>
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <Table striped bordered hover size="sm" className="mb-0" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Device Info</th>
                    <th>IP</th>
                    <th>City</th>
                    <th>Region</th>
                    <th>Organization</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d, i) => (
                    <tr key={i}>
                      <td>{perPage * (page - 1) + i + 1}</td>
                      <td>{String(d.mstruserid ?? '')}</td>
                      <td>{String(d.device_info ?? '')}</td>
                      <td>{String(d.ipadress ?? '')}</td>
                      <td>{String(d.city ?? '')}</td>
                      <td>{String(d.region ?? '')}</td>
                      <td>{String(d.org ?? '')}</td>
                      <td>{d.logstdt ? formatMedium(String(d.logstdt)) : ''}</td>
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center">
                        No Data Available
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </Table>
            </div>
            <Pagination page={page} total={meta.total ?? 0} perPage={perPage} onChange={load} />
          </>
        )}
      </div>
    </div>
  )
}
