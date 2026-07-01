/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_SOCKET_URL: string
  readonly VITE_SOCKET_PATH: string
  readonly VITE_GEO_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
