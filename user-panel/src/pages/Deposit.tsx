import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { toast } from 'react-toastify'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../store/auth'
import { Loader } from '../components/common/Loader'
import { getDeviceInfo } from '../utils/device'
import {
  GATEWAYS,
  depositManual,
  depositNew,
  fastWithdrawShow,
  getBanks,
  type GatewayAccount,
  type WalletSettings,
} from '../services/walletApi'

// Copy without ever logging the sensitive value.
const copy = (v?: string) => {
  if (!v) return
  void navigator.clipboard?.writeText(v)
  toast.success('Copied!')
}

// Deposit — gateway/account selection, UPI QR, copyable account details, and a
// manual deposit (UTR or screenshot) with the exact FormData payload + validations.
// Double submission is guarded; no sensitive data is logged.
export default function Deposit() {
  useDocumentTitle('Deposit')
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const parentId = (user?.parentId as number | string) ?? ''
  const paymentType = Number(user?.payment_type ?? 1)

  const [accounts, setAccounts] = useState<GatewayAccount[]>([])
  const [settings, setSettings] = useState<WalletSettings>({})
  const [loading, setLoading] = useState(true)
  const [payment, setPayment] = useState<number | null>(null)
  const [account, setAccount] = useState<GatewayAccount | null>(null)

  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<'utr' | 'screenshot'>('utr')
  const [utrNo, setUtrNo] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const placingRef = useRef(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getBanks(parentId, 0)
        .then((r) => setAccounts(r.data ?? []))
        .catch(() => setAccounts([])),
      fastWithdrawShow(parentId)
        .then((r) => setSettings(r.data ?? {}))
        .catch(() => setSettings({})),
    ]).finally(() => setLoading(false))
  }, [parentId])

  const gateways = useMemo(() => {
    const seen = new Set<number>()
    return accounts.filter((a) => (seen.has(Number(a.payment)) ? false : (seen.add(Number(a.payment)), true)))
  }, [accounts])
  const gatewayAccounts = useMemo(
    () => accounts.filter((a) => Number(a.payment) === payment),
    [accounts, payment],
  )

  const validate = (): boolean => {
    const amt = Number(amount)
    if (!account?.id) return (setErrorMsg('Please select account type'), false)
    if (!amount) return (setErrorMsg('Please enter amount'), false)
    if (amt <= 0) return (setErrorMsg('Please enter valid amount'), false)
    if (mode === 'utr' && !utrNo) return (setErrorMsg('Please enter utr number'), false)
    if (mode === 'screenshot' && !file) return (setErrorMsg('Please select screenshot'), false)
    if (settings.min_deposit && settings.min_deposit > 0 && amt < settings.min_deposit)
      return (setErrorMsg(`Please enter amount greater than ${settings.min_deposit}`), false)
    if (settings.max_deposit && settings.max_deposit > 0 && amt > settings.max_deposit)
      return (setErrorMsg(`Please enter amount less than ${settings.max_deposit}`), false)
    setErrorMsg('')
    return true
  }

  const submitManual = async () => {
    if (placingRef.current) return
    if (!validate()) return
    placingRef.current = true
    setSubmitting(true)
    const fd = new FormData()
    fd.append('is_utr', mode === 'utr' ? '1' : '0')
    if (mode === 'utr') fd.append('utr_no', utrNo)
    else if (file) fd.append('screenShotsFile', file)
    fd.append('amount', amount)
    fd.append('acc_type', String(account?.id ?? ''))
    try {
      const res = await depositManual(fd)
      if (res?.status) navigate('/request')
    } catch {
      /* interceptor toast */
    } finally {
      setSubmitting(false)
      placingRef.current = false
    }
  }

  const submitGateway = async () => {
    if (placingRef.current) return
    const amt = Number(amount)
    if (!amount) return setErrorMsg('Amount is required')
    if (amt < 200) return setErrorMsg('Please enter minimum 200 amount')
    if (settings.min_deposit && settings.min_deposit > 0 && amt < settings.min_deposit)
      return setErrorMsg(`Please enter amount greater than ${settings.min_deposit}`)
    if (settings.max_deposit && settings.max_deposit > 0 && amt > settings.max_deposit)
      return setErrorMsg(`Please enter amount less than ${settings.max_deposit}`)
    setErrorMsg('')
    placingRef.current = true
    setSubmitting(true)
    try {
      const res = await depositNew(amt, getDeviceInfo().device_info === 'Mobile')
      if (res?.status && res.data) window.open(res.data, '_blank')
    } catch {
      /* interceptor toast */
    } finally {
      setSubmitting(false)
      placingRef.current = false
    }
  }

  if (loading) return <Loader />

  const detailRow = (label: string, value?: string) =>
    value ? (
      <div className="d-flex justify-content-between align-items-center border-bottom py-1">
        <span className="text-muted">{label}</span>
        <span className="d-flex align-items-center gap-2">
          <b>{value}</b>
          <button type="button" className="btn btn-sm btn-outline-secondary py-0" onClick={() => copy(value)}>
            Copy
          </button>
        </span>
      </div>
    ) : null

  return (
    <div id="wrapper">
      <div className="container dashboard_content py-3">
        <h5 className="mb-3">Deposit</h5>

        <div className="d-flex flex-wrap gap-2 mb-3">
          {gateways.map((g) => (
            <button
              key={String(g.payment)}
              type="button"
              className={`btn btn-sm ${payment === Number(g.payment) ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => {
                setPayment(Number(g.payment))
                setAccount(null)
              }}
            >
              {GATEWAYS[Number(g.payment)]?.name ?? `Gateway ${g.payment}`}
            </button>
          ))}
        </div>

        {payment !== null && gatewayAccounts.length > 0 ? (
          <div className="d-flex flex-wrap gap-2 mb-3">
            {gatewayAccounts.map((a, i) => (
              <button
                key={String(a.id ?? i)}
                type="button"
                className={`btn btn-sm ${account?.id === a.id ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setAccount(a)}
              >
                Payment {i + 1}
              </button>
            ))}
          </div>
        ) : null}

        {account ? (
          <div className="row g-3">
            <div className="col-12 col-md-6">
              {detailRow('Account No.', account.acc_num)}
              {detailRow('IFSC Code', account.ifsc_code)}
              {detailRow('Phone / UPI', account.upi)}
              {detailRow('Account Name', account.acc_name)}
              {detailRow('Bank Name', account.bank_name)}
              {detailRow('Branch Name', account.branch_name)}
              {account.upi ? (
                <div className="text-center mt-3">
                  <QRCodeCanvas value={`upi://pay?pa=${account.upi}`} size={200} marginSize={2} level="M" />
                </div>
              ) : null}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Amount</label>
              <input
                type="text"
                inputMode="numeric"
                className="form-control mb-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />

              {paymentType === 1 ? (
                <>
                  <div className="mb-2">
                    <label className="me-3">
                      <input type="radio" checked={mode === 'utr'} onChange={() => setMode('utr')} /> UTR
                    </label>
                    <label className="me-3">
                      <input type="radio" checked={mode === 'screenshot'} onChange={() => setMode('screenshot')} /> Screenshot
                    </label>
                  </div>
                  {mode === 'utr' ? (
                    <input
                      className="form-control mb-2"
                      value={utrNo}
                      onChange={(e) => setUtrNo(e.target.value)}
                      placeholder="Enter UTR number"
                    />
                  ) : (
                    <input
                      type="file"
                      className="form-control mb-2"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  )}
                  {errorMsg ? <div className="text-danger fs-12 mb-2">{errorMsg}</div> : null}
                  <button className="btn btn-success" onClick={() => void submitManual()} disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit'}
                  </button>
                </>
              ) : (
                <>
                  {errorMsg ? <div className="text-danger fs-12 mb-2">{errorMsg}</div> : null}
                  <button className="btn btn-success" onClick={() => void submitGateway()} disabled={submitting}>
                    {submitting ? 'Please wait…' : 'Click To Pay'}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
