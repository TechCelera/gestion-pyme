import { defineConfig, devices } from '@playwright/test'

/**
 * - `PLAYWRIGHT_SKIP_WEBSERVER=1`: no arranca `next dev` (usá cuando ya tenés `npm run dev`).
 * - Sin eso: Playwright intenta levantar el dev (CI / máquina limpia). Next **no** permite dos
 *   `next dev` en el mismo repo; el probe `reuseExistingServer` falla a menudo (IPv4/IPv6, redirects).
 *   Por eso **`npm run test:e2e`** en package.json fuerza skip; **`npm run test:e2e:ci`** no.
 */
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1'
const PLAYWRIGHT_HOST = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1'
const PLAYWRIGHT_PORT = process.env.PLAYWRIGHT_PORT ?? '3000'
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  `http://${PLAYWRIGHT_HOST}:${PLAYWRIGHT_PORT}`

/** Ruta estable para el probe del webServer (evita cadena de redirects desde `/`). */
const webServerReadyURL = process.env.PLAYWRIGHT_WEBSERVER_URL ?? `${baseURL}/login`

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: `npm run dev -- -p ${PLAYWRIGHT_PORT} -H ${PLAYWRIGHT_HOST}`,
          url: webServerReadyURL,
          reuseExistingServer: process.env.PLAYWRIGHT_FORCE_FRESH_SERVER !== '1',
          timeout: 300_000,
        },
      }),
})
