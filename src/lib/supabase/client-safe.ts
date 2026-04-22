import { createBrowserClient } from '@supabase/ssr'

export function createSafeBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables:')
    if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseKey) console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  return createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key'
  )
}
