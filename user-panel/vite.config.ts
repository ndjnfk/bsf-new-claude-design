/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server proxies the bettor API + WebSocket to the Go backend so the browser
// can use same-origin relative URLs (/api/user, /ws). The User Panel talks ONLY
// to the /api/user/* surface (see MIGRATION_PLAN.md) plus /ws.
export default defineConfig({
  plugins: [react()],
  // Bootstrap 5.3's SCSS still uses Sass color functions that Dart Sass now warns
  // about. They're upstream (a dependency), so quiet them to keep our build output
  // clean without touching Bootstrap.
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler', quietDeps: true, silenceDeprecations: ['import', 'color-functions', 'global-builtin'] },
    },
  },
  server: {
    port: 4300,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8080', ws: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
  },
})
