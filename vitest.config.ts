import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    /**
     * Vitest 4 default `forks` pool puede agotar tiempo al arrancar workers bajo carga
     * (p. ej. `verify:all:local` con `next dev` + `next build`). `threads` evita esos timeouts.
     * @see https://vitest.dev/config/#pool
     */
    pool: 'threads',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
