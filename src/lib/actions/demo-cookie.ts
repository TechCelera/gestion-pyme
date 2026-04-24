'use server'

import { cookies } from 'next/headers'

const DEMO_COOKIE_NAME = 'demo_mode'
const DEMO_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 días

export async function setDemoCookie(): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    cookieStore.set(DEMO_COOKIE_NAME, 'true', {
      path: '/',
      maxAge: DEMO_COOKIE_MAX_AGE,
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    return { success: true }
  } catch (error) {
    console.error('setDemoCookie error:', error)
    return { success: false, error: 'No se pudo setear cookie de demo' }
  }
}

export async function clearDemoCookie(): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(DEMO_COOKIE_NAME)
    return { success: true }
  } catch (error) {
    console.error('clearDemoCookie error:', error)
    return { success: false, error: 'No se pudo limpiar cookie de demo' }
  }
}

export async function isDemoModeCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(DEMO_COOKIE_NAME)?.value === 'true'
  } catch (error) {
    console.error('isDemoModeCookie error:', error)
    return false
  }
}
