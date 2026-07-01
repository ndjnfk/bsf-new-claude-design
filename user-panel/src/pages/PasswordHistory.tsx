import { useCallback, useEffect, useState } from 'react'
import { Table } from 'react-bootstrap'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Loader } from '../components/common/Loader'
import { Pagination } from '../components/common/Pagination'
import { fetchPasswordHistory, type Meta, type Row } from '../services/reportsApi'
import { formatMedium } from '../utils/format'

export default function PasswordHistory() {
  useDocumentTitle('Password History')
  const [rows, setRows] = useState<Row[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, per_page: 10 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback((p: number) => {
    setLoading(true)
    setError(false)
    setPage(p)
    fetchPasswordHistory(p)
      .then((res) => {
        setRows(res.data?.data ?? [])
        setMeta(res.data?.meta ?? { total: 0, per_page: 10 })
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => load(1), [load])

  const perPage = meta.per_page ?? 10

  return (
    <div id="wrapper">
      <div className="container dashboard_content py-3">
        <h5 className="mb-3">Password History</h5>
        {loading ? (
          <Loader />
        ) : error ? (
          <p className="text-center text-danger py-4">Failed to load password history.</p>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Username</th>
                  <th>Changer Name</th>
                  <th>IP</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d, i) => (
                  <tr key={i}>
                    <td>{perPage * (page - 1) + i + 1}</td>
                    <td>{String(d.username ?? '')}</td>
                    <td>{String(d.changername ?? '')}</td>
                    <td>{String(d.ip ?? '')}</td>
                    <td>{d.created_at ? formatMedium(String(d.created_at)) : ''}</td>
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
            <Pagination page={page} total={meta.total ?? 0} perPage={perPage} onChange={load} />
          </div>
        )}
      </div>
    </div>
  )
}
