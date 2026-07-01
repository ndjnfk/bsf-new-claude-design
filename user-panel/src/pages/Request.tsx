import { useCallback, useEffect, useState } from 'react'
import { Modal, Button, Table } from 'react-bootstrap'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Loader } from '../components/common/Loader'
import { Pagination } from '../components/common/Pagination'
import { amountCal, getRequests, type Meta, type RequestRow } from '../services/walletApi'
import { daysAgoApi, formatMedium, todayApi } from '../utils/format'

const PER_PAGE = 10

type BankDetails = {
  acc_num?: string
  upi?: string
  ifsc_code?: string
  acc_name?: string
  bank_name?: string
  branch_name?: string
}
function parseBank(v: unknown): BankDetails {
  if (typeof v !== 'string') return (v as BankDetails) ?? {}
  try {
    return JSON.parse(v) as BankDetails
  } catch {
    return {}
  }
}

// Deposit / withdraw request history with quick date filters, view + screenshot
// modals, and the fast-withdraw deducted-amount display.
export default function Request() {
  useDocumentTitle('Request')
  const [from, setFrom] = useState(todayApi())
  const [to, setTo] = useState(todayApi())
  const [rows, setRows] = useState<RequestRow[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, per_page: PER_PAGE })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [viewRow, setViewRow] = useState<RequestRow | null>(null)
  const [viewImg, setViewImg] = useState<string | null>(null)

  const load = useCallback((p: number, f: string, t: string) => {
    setLoading(true)
    setError(false)
    setPage(p)
    setFrom(f)
    setTo(t)
    getRequests({ from_date: f, to_date: t }, p)
      .then((res) => {
        setRows(res.data?.data ?? [])
        setMeta(res.data?.meta ?? { total: 0, per_page: PER_PAGE })
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => load(1, todayApi(), todayApi()), [load])

  const quick = (key: 'today' | 'yesterday' | '7_day' | '30_day') => {
    const t = todayApi()
    const f = key === 'today' ? t : key === 'yesterday' ? daysAgoApi(1) : key === '7_day' ? daysAgoApi(7) : daysAgoApi(30)
    load(1, f, t)
  }

  const bank = viewRow ? parseBank(viewRow.bank_details) : {}

  return (
    <div id="wrapper">
      <div className="container dashboard_content py-3">
        <h5 className="mb-3">Requests</h5>

        <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
          <div>
            <label className="form-label">From</label>
            <input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">To</label>
            <input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button variant="success" onClick={() => load(1, from, to)}>
            Submit
          </Button>
          <div className="ms-auto btn-group">
            <Button size="sm" variant="outline-secondary" onClick={() => quick('today')}>
              Today
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={() => quick('yesterday')}>
              Yesterday
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={() => quick('7_day')}>
              7 Days
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={() => quick('30_day')}>
              30 Days
            </Button>
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : error ? (
          <p className="text-center text-danger py-4">Failed to load requests.</p>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Utr No</th>
                  <th>Status</th>
                  <th>Remark</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d, i) => (
                  <tr key={i}>
                    <td>{d.req_date ? formatMedium(String(d.req_date)) : ''}</td>
                    <td>{String(d.desc ?? '')}</td>
                    <td>{Number(d.req_method) === 1 ? 'Fast' : 'Normal'}</td>
                    <td>{amountCal(Number(d.req_method), Number(d.req_amount), Number(d.fast_withdraw))}</td>
                    <td>{Number(d.type) === 1 ? 'Deposit' : 'Withdraw'}</td>
                    <td>{String(d.utr ?? '')}</td>
                    <td>{String(d.status ?? '')}</td>
                    <td>{d.remark ? String(d.remark) : '-'}</td>
                    <td>
                      <Button size="sm" variant="link" className="p-0 me-2" onClick={() => setViewRow(d)}>
                        View
                      </Button>
                      {d.screen_shots ? (
                        <Button size="sm" variant="link" className="p-0" onClick={() => setViewImg(String(d.screen_shots))}>
                          Screenshot
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center">
                      No Data Available
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
            <Pagination page={page} total={meta.total ?? 0} perPage={meta.per_page ?? PER_PAGE} onChange={(p) => load(p, from, to)} />
          </div>
        )}
      </div>

      <Modal show={!!viewRow} onHide={() => setViewRow(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Request Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewRow ? (
            <dl className="row mb-0">
              {bank.acc_num ? (
                <>
                  <dt className="col-5">Account Number</dt>
                  <dd className="col-7">{bank.acc_num}</dd>
                </>
              ) : null}
              {bank.upi ? (
                <>
                  <dt className="col-5">UPI / Mobile</dt>
                  <dd className="col-7">{bank.upi}</dd>
                </>
              ) : null}
              {bank.ifsc_code ? (
                <>
                  <dt className="col-5">IFSC Code</dt>
                  <dd className="col-7">{bank.ifsc_code}</dd>
                </>
              ) : null}
              {bank.acc_name ? (
                <>
                  <dt className="col-5">Account Name</dt>
                  <dd className="col-7">{bank.acc_name}</dd>
                </>
              ) : null}
              {bank.bank_name ? (
                <>
                  <dt className="col-5">Bank Name</dt>
                  <dd className="col-7">{bank.bank_name}</dd>
                </>
              ) : null}
              {bank.branch_name ? (
                <>
                  <dt className="col-5">Branch Name</dt>
                  <dd className="col-7">{bank.branch_name}</dd>
                </>
              ) : null}
              <dt className="col-5">Amount</dt>
              <dd className="col-7">{String(viewRow.req_amount ?? '')}</dd>
              <dt className="col-5">Status</dt>
              <dd className="col-7">{String(viewRow.status ?? '')}</dd>
              <dt className="col-5">UTR No.</dt>
              <dd className="col-7">{viewRow.utr ? String(viewRow.utr) : 'N/A'}</dd>
              {viewRow.approved_amount ? (
                <>
                  <dt className="col-5">Approved Amount</dt>
                  <dd className="col-7">{String(viewRow.approved_amount)}</dd>
                </>
              ) : null}
            </dl>
          ) : null}
        </Modal.Body>
      </Modal>

      <Modal show={!!viewImg} onHide={() => setViewImg(null)} centered>
        <Modal.Body className="p-0">
          {viewImg ? <img src={viewImg} alt="Screenshot" className="d-block w-100" /> : null}
        </Modal.Body>
      </Modal>
    </div>
  )
}
