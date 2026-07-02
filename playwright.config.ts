import { defineConfig, devices } from '@playwright/test'

import { loadPlaywrightEnv } from './e2e/helpers/load-env'

loadPlaywrightEnv()

/**
 * - `PLAYWRIGHT_SKIP_WEBSERVER=1`: no arranca `next dev` (usá cuando ya tenés `pnpm run dev`).
 * - Sin eso: Playwright intenta levantar el dev (CI / máquina limpia). Next **no** permite dos
 *   `next dev` en el mismo repo; el probe `reuseExistingServer` falla a menudo (IPv4/IPv6, redirects).
 *   Por eso **`pnpm run test:e2e`** en package.json fuerza skip; **`pnpm run test:e2e:ci`** no.
 */
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1'
const PLAYWRIGHT_HOST = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1'
const PLAYWRIGHT_PORT = process.env.PLAYWRIGHT_PORT ?? '3000'
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  `http://${PLAYWRIGHT_HOST}:${PLAYWRIGHT_PORT}`

/** Ruta estable para el probe del webServer (evita cadena de redirects desde `/`). */
const webServerReadyURL = process.env.PLAYWRIGHT_WEBSERVER_URL ?? `${baseURL}/login`

const e2eAuthEnabled = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
    process.env.E2E_TEST_EMAIL?.trim() &&
    process.env.E2E_TEST_PASSWORD
)

/** Usuario E2E dedicado: no mezclar con prefill demo (campos readonly en /login). */
const e2eEmail = process.env.E2E_TEST_EMAIL?.trim().toLowerCase()
const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL?.trim().toLowerCase()
const disableDemoLoginForE2e =
  e2eAuthEnabled && (!demoEmail || e2eEmail !== demoEmail)

const webServerEnv = disableDemoLoginForE2e
  ? {
      ...process.env,
      NEXT_PUBLIC_DEMO_LOGIN_ENABLED: '0',
      NEXT_PUBLIC_DEMO_EMAIL: '',
      NEXT_PUBLIC_DEMO_PASSWORD: '',
    }
  : process.env

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 90_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },
  projects: [
    ...(e2eAuthEnabled ? [{ name: 'setup', testMatch: /auth\.setup\.ts/ }] : []),
    {
      name: 'chromium',
      testIgnore: [/auth\.setup\.ts/, /authenticated\//],
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    ...(e2eAuthEnabled
      ? [
          {
            name: 'authenticated',
            testMatch: /authenticated\/.*\.spec\.ts/,
            dependencies: ['setup'],
            use: {
              ...devices['Desktop Chrome'],
              channel: 'chrome',
              storageState: 'e2e/.auth/user.json',
            },
          },
        ]
      : []),
  ],
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: `NODE_OPTIONS="${process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ''}--disable-warning=DEP0205" pnpm exec next dev -p ${PLAYWRIGHT_PORT} -H ${PLAYWRIGHT_HOST}`,
          url: webServerReadyURL,
          reuseExistingServer: process.env.PLAYWRIGHT_FORCE_FRESH_SERVER !== '1',
          timeout: 300_000,
          env: webServerEnv as Record<string, string>,
        },
      }),
})
