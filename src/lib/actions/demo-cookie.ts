'use server'

import { cookies } from 'next/headers'

const DEMO_COOKIE_NAME = 'demo_mode'
const DEMO_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 días

export async function setDemoCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(DEMO_COOKIE_NAME, 'true', {
    path: '/',
    maxAge: DEMO_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function clearDemoCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(DEMO_COOKIE_NAME)
}

export async function isDemoModeCookie(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(DEMO_COOKIE_NAME)?.value === 'true'
}
