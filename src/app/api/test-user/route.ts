import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'not authenticated', details: authError?.message })
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, company_id, email, role')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    userId: user.id,
    userEmail: user.email,
    userData: data,
    error: error?.message,
    errorCode: error?.code
  })
}