import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../store/auth'
import {
  GATEWAYS,
  fastWithdrawShow,
  getBanks,
  getUserBanks,
  withdraw,
  type GatewayAccount,
  type UserBank,
  type WalletSettings,
} from '../services/walletApi'

type WithdrawForm = {
  payment: string
  acc_name: string
  acc_num?: string
  ifsc_code?: string
  upi?: string
  bank_name?: string
  branch_name?: string
  amount: number
  req_method?: number
}

// Withdraw — the Angular Formly form converted to React Hook Form with
// gateway-conditional fields (bank gateways 4/9 need acc/ifsc/bank, others need UPI;
// gateway 9 also needs branch). Payload preserved exactly; double-submit guarded.
export default function Withdraw() {
  useDocumentTitle('Withdraw')
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const parentId = (user?.parentId as number | string) ?? ''
  const mstrid = (user?.parentId as number | string) ?? ''

  const [gateways, setGateways] = useState<GatewayAccount[]>([])
  const [settings, setSettings] = useState<WalletSettings>({})
  const [savedBanks, setSavedBanks] = useState<UserBank[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WithdrawForm>({ shouldUnregister: true, defaultValues: { payment: '' } })

  useEffect(() => {
    getUserBanks().then((r) => setSavedBanks(r.data ?? [])).catch(() => setSavedBanks([]))
    fastWithdrawShow(mstrid).then((r) => setSettings(r.data ?? {})).catch(() => setSettings({}))
    getBanks(parentId, 1).then((r) => setGateways(r.data ?? [])).catch(() => setGateways([]))
  }, [parentId, mstrid])

  const payment = watch('payment')
  const reqMethod = watch('req_method')
  const gw = payment ? GATEWAYS[Number(payment)] : undefined
  const isBank = !!gw?.bank
  const isBranch = !!gw?.branch
  const fastWithdraw = Number(settings.fast_withdraw ?? 0)
  const minAmt = settings.min_withdraw && settings.min_withdraw > 0 ? settings.min_withdraw : 1
  const maxAmt = settings.max_withdraw && settings.max_withdraw > 0 ? settings.max_withdraw : undefined

  const selectedGateway = useMemo(
    () => gateways.find((g) => String(g.payment) === String(payment)),
    [gateways, payment],
  )

  const onPickBank = (bankId: string) => {
    const b = savedBanks.find((x) => String(x.id) === bankId)
    if (!b) return
    setValue('acc_name', b.account_name)
    setValue('acc_num', b.account_number)
    setValue('ifsc_code', b.ifsc_code)
    setValue('bank_name', b.bank_name)
  }

  const onSubmit = handleSubmit(async (values) => {
    const method = Number(values.req_method ?? 0) === 1 ? 1 : 0
    const payload = {
      payment: String(values.payment),
      acc_name: values.acc_name,
      acc_num: values.acc_num,
      ifsc_code: values.ifsc_code,
      upi: values.upi,
      bank_name: values.bank_name,
      branch_name: values.branch_name,
      amount: Number(values.amount),
      req_method: method,
      fast_withdraw: method === 1 ? fastWithdraw : 0,
      acc_type: String(selectedGateway?.bankId ?? ''),
    }
    try {
      const res = await withdraw(payload)
      if (res?.status) navigate('/request')
    } catch {
      /* interceptor toast */
    }
  })

  // Available gateways (unique payment ids from the type=1 list).
  const available = useMemo(() => {
    const seen = new Set<number>()
    return gateways.filter((g) => (seen.has(Number(g.payment)) ? false : (seen.add(Number(g.payment)), true)))
  }, [gateways])

  return (
    <div id="wrapper">
      <div className="container dashboard_content py-3 withdraw-ui">
        <h5 className="mb-3">Withdraw</h5>

        <div className="d-flex flex-wrap gap-2 mb-3">
          {available.map((g) => (
            <button
              key={String(g.payment)}
              type="button"
              className={`btn btn-sm ${String(payment) === String(g.payment) ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => setValue('payment', String(g.payment))}
            >
              {GATEWAYS[Number(g.payment)]?.name ?? `Gateway ${g.payment}`}
            </button>
          ))}
        </div>

        {payment ? (
          <form onSubmit={onSubmit} className="row g-2" noValidate>
            {isBank ? (
              <div className="col-12 col-md-4">
                <label className="form-label">Saved Account</label>
                <select className="form-select" defaultValue="" onChange={(e) => onPickBank(e.target.value)}>
                  <option value="">Select Account</option>
                  {savedBanks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.account_number}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="col-12 col-md-4">
              <label className="form-label">ACCOUNT NAME</label>
              <input className="form-control" {...register('acc_name', { required: 'Account name is required' })} />
              {errors.acc_name ? <div className="text-danger fs-12">{errors.acc_name.message}</div> : null}
            </div>

            {isBank ? (
              <>
                <div className="col-12 col-md-4">
                  <label className="form-label">ACCOUNT NUMBER</label>
                  <input className="form-control" {...register('acc_num', { required: 'Account number is required' })} />
                  {errors.acc_num ? <div className="text-danger fs-12">{errors.acc_num.message}</div> : null}
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label">IFSC CODE</label>
                  <input className="form-control" {...register('ifsc_code', { required: 'IFSC is required' })} />
                  {errors.ifsc_code ? <div className="text-danger fs-12">{errors.ifsc_code.message}</div> : null}
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label">BANK NAME</label>
                  <input className="form-control" {...register('bank_name', { required: 'Bank name is required' })} />
                  {errors.bank_name ? <div className="text-danger fs-12">{errors.bank_name.message}</div> : null}
                </div>
                {isBranch ? (
                  <div className="col-12 col-md-4">
                    <label className="form-label">BRANCH NAME</label>
                    <input className="form-control" {...register('branch_name', { required: 'Branch name is required' })} />
                    {errors.branch_name ? <div className="text-danger fs-12">{errors.branch_name.message}</div> : null}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="col-12 col-md-4">
                <label className="form-label">UPI ID / MOBILE NUMBER</label>
                <input className="form-control" {...register('upi', { required: 'UPI/mobile is required' })} />
                {errors.upi ? <div className="text-danger fs-12">{errors.upi.message}</div> : null}
              </div>
            )}

            <div className="col-12 col-md-4">
              <label className="form-label">AMOUNT</label>
              <input
                type="number"
                className="form-control"
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: minAmt, message: `Min: ${minAmt}` },
                  ...(maxAmt ? { max: { value: maxAmt, message: `Max: ${maxAmt}` } } : {}),
                })}
              />
              <div className="fs-12 text-muted">{`Min: ${minAmt}${maxAmt ? ` - Max: ${maxAmt}` : ''}`}</div>
              {errors.amount ? <div className="text-danger fs-12">{errors.amount.message}</div> : null}
            </div>

            {fastWithdraw > 0 ? (
              <div className="col-12 col-md-4">
                <label className="form-label d-block">Request Method</label>
                <label className="me-3">
                  <input type="radio" value={0} {...register('req_method', { valueAsNumber: true })} /> Normal
                </label>
                <label className="me-3">
                  <input type="radio" value={1} {...register('req_method', { valueAsNumber: true })} /> Fast
                </label>
                {Number(reqMethod) === 1 ? (
                  <div className="fs-12 text-warning">{fastWithdraw} % Extra Charge for Fast Request</div>
                ) : null}
              </div>
            ) : null}

            <div className="col-12">
              <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-muted">Select a payment method to continue.</p>
        )}
      </div>
    </div>
  )
}
