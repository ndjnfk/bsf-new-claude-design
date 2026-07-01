import { post } from '../api/http'

// Auth/registration endpoints, payloads preserved exactly from the Angular app.
type StatusResponse = { status?: boolean; [key: string]: unknown }

// Username availability — POST 'username' { username }. Angular treats !status as taken.
export const checkUsername = (username: string) => post<StatusResponse>('username', { username })

// Forgot-password OTP — POST 'passwordOtp' { phone }.
export const sendPasswordOtp = (phone: string) => post<StatusResponse>('passwordOtp', { phone })

// Reset password — POST 'updatePassword' { password, confirmPassword, otp, phone }.
export const updatePassword = (data: {
  password: string
  confirmPassword: string
  otp: string
  phone: string
}) => post<StatusResponse>('updatePassword', data)

// Register — POST 'userRegister' (full form payload).
export const registerUser = (data: Record<string, unknown>) => post<StatusResponse>('userRegister', data)

// OTP helpers (register flow) — POST 'sendOtp' { phone, code? } / 'verifyEmail' { email }.
export const sendOtp = (phone: string, code?: string) =>
  post<StatusResponse>('sendOtp', code ? { phone, code } : { phone })
export const verifyEmail = (email: string) => post<StatusResponse>('verifyEmail', { email })
