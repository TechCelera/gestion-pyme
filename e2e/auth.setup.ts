import { test as setup } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

import {
  AUTH_STORAGE_PATH,
  e2eCredentials,
  hasSupabasePublicEnv,
  loginViaUi,
} from './helpers/auth'

setup('authenticate test user', async ({ page }) => {
  if (!hasSupabasePublicEnv()) {
    setup.skip(true, 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const creds = e2eCredentials()
  if (!creds) {
    setup.skip(true, 'Missing E2E_TEST_EMAIL or E2E_TEST_PASSWORD')
  }

  await loginViaUi(page, creds!.email, creds!.password)

  fs.mkdirSync(path.dirname(AUTH_STORAGE_PATH), { recursive: true })
  await page.context().storageState({ path: AUTH_STORAGE_PATH })
})
