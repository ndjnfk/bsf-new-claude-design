// Auth token storage. Preserves the EXACT behaviour of the Angular ApiService:
// the JWT lives in sessionStorage under the key 'token' (set from user.TokenId on
// login, read by the request interceptor, cleared on logout/401).
const TOKEN_KEY = 'token'

export const getToken = (): string | null => sessionStorage.getItem(TOKEN_KEY)
export const setToken = (token: string): void => sessionStorage.setItem(TOKEN_KEY, token)
export const clearToken = (): void => sessionStorage.removeItem(TOKEN_KEY)
