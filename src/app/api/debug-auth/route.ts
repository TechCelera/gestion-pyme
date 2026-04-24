import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        step: 'auth',
        error: authError?.message || 'No user in session',
        cookies: 'check cookies manually'
      })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id, id, email')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        step: 'user_query',
        userId: user.id,
        userError: userError?.message || 'No user record found',
        rawUserData: userData
      })
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_transactions', {
      p_company_id: userData.company_id,
      p_status: null,
      p_type: null,
      p_date_from: null,
      p_date_to: null,
      p_account_id: null,
      p_category_id: null,
      p_contact_id: null,
      p_search: null,
      p_limit: 50,
      p_offset: 0,
    })

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      companyId: userData.company_id,
      transactionsCount: rpcData?.length || 0,
      rpcError: rpcError?.message
    })
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}