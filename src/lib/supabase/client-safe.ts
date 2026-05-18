import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | undefined

export function createSafeBrowserClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables:')
    if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseKey) console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseKey || 'placeholder-key'
    )
  }

  return browserClient
}
