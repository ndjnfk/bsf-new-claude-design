import { get, post, put, del } from '../api/http'

// Payment gateways (ids 1-9). `bank` = needs account number + IFSC (+ branch for 9);
// otherwise UPI/phone. Preserved exactly from the Angular component.
export const GATEWAYS: Record<number, { name: string; bank: boolean; branch?: boolean }> = {
  1: { name: 'PhonePay', bank: false },
  2: { name: 'Paytm', bank: false },
  3: { name: 'Gpay', bank: false },
  4: { name: 'IMPS', bank: true },
  5: { name: 'Neteller', bank: false },
  6: { name: 'Bkash MFS', bank: false },
  7: { name: 'Nagad MFS', bank: false },
  8: { name: 'Rocket MFS', bank: false },
  9: { name: 'Bank Transfer', bank: true, branch: true },
}

export type GatewayAccount = {
  id?: number | string
  payment: number
  bankId?: number | string
  acc_num?: string
  ifsc_code?: string
  upi?: string
  acc_name?: string
  bank_name?: string
  branch_name?: string
  payu_url?: string
  payu_status?: number
  [key: string]: unknown
}

export type WalletSettings = {
  fast_withdraw?: number
  min_deposit?: number
  max_deposit?: number
  min_withdraw?: number
  max_withdraw?: number
}

export type UserBank = {
  id: number | string
  account_name: string
  account_number: string
  ifsc_code: string
  bank_name: string
  is_default?: boolean
}
export type BankForm = {
  account_name: string
  account_number: string
  ifsc_code: string
  bank_name: string
  is_default: boolean
}

export type Meta = { total?: number; current_page?: number; per_page?: number }
export type RequestRow = Record<string, unknown>

// ── Gateways / settings ───────────────────────────────────────────────────────
export const getBanks = (parentId: number | string, type: 0 | 1) =>
  post<{ data: GatewayAccount[] }>('getBanks', { parentId, type })
export const fastWithdrawShow = (mstrid: number | string) =>
  post<{ data: WalletSettings }>('fastWithdrawShow', { mstrid })

// ── Deposit ───────────────────────────────────────────────────────────────────
// Manual deposit is multipart (utr or screenshot) — let the browser set the boundary.
export const depositManual = (fd: FormData) =>
  post<{ status?: boolean }>('deposit', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
export const depositNew = (amount: number, isMobile: boolean) =>
  post<{ status?: boolean; data?: string }>('depositNew', { amount, isMobile })

// ── Withdraw ──────────────────────────────────────────────────────────────────
export const withdraw = (payload: Record<string, unknown>) => post<{ status?: boolean }>('withdraw', payload)

// ── Requests history ──────────────────────────────────────────────────────────
export const getRequests = (body: { from_date: string; to_date: string }, page: number) =>
  post<{ data: { data: RequestRow[]; meta?: Meta } }>('getRequest', body, { params: { page } })

// ── Saved banks CRUD ──────────────────────────────────────────────────────────
export const getUserBanks = () => get<{ data: UserBank[] }>('userBanks')
export const createUserBank = (body: BankForm) => post('userBanks', body)
export const updateUserBank = (id: number | string, body: BankForm) => put(`userBanks/${id}`, body)
export const deleteUserBank = (id: number | string) => del(`userBanks/${id}`)

// Fast-withdraw deducted amount: amount - (fast_withdraw% * amount)/100.
export const amountCal = (reqMethod: number | string, amount: number, fastWithdraw: number): number =>
  Number(reqMethod) === 1 ? Number(amount) - (Number(fastWithdraw) * Number(amount)) / 100 : Number(amount)
