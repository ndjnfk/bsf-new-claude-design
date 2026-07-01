// Runtime config sourced from Vite env vars, with defaults matching the Angular
// production environment (environment.prod.ts: base '/api/', socket '/'). Override
// per-environment via .env / .env.local. In dev, Vite's proxy forwards /api and /ws
// to the Go backend, so the relative '/api/' default works without a full URL.
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api/'
export const SOCKET_URL: string = import.meta.env.VITE_SOCKET_URL ?? '/'
// Socket.IO handshake path — preserved exactly from the Angular SocketIoConfig.
export const SOCKET_PATH: string = import.meta.env.VITE_SOCKET_PATH ?? '/api/socket.io'
// Best-effort geolocation used to enrich the login payload (Angular used ipapi.co).
export const GEO_URL: string = import.meta.env.VITE_GEO_URL ?? 'https://ipapi.co/json'
