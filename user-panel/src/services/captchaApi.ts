import { get } from '../api/http'

// Captcha challenge from GET 'captcha' → { captcha: [d,d,d,d], unix }.
export type Captcha = { captcha: number[]; unix: number }

export function fetchCaptcha(): Promise<Captcha> {
  return get<Captcha>('captcha')
}
