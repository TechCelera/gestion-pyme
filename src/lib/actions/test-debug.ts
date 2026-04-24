'use server'

import { createClient } from '@/lib/supabase/server'
import { transactionFiltersSchema } from '@/lib/validations/transaction'

export async function testGetTransactions() {
  try {
    console.log('testGetTransactions: Starting')
    const supabase = await createClient()
    console.log('testGetTransactions: Supabase client created')

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('testGetTransactions: auth result', { userId: user?.id, authError })

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    console.log('testGetTransactions: Querying users table')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    console.log('testGetTransactions: user query result', { userData, userError })

    if (userError || !userData?.company_id) {
      return { success: false, error: userError?.message || 'No company_id found' }
    }

    const companyId = userData.company_id
    console.log('testGetTransactions: companyId', companyId)

    console.log('testGetTransactions: Calling RPC')
    const { data, error: rpcError } = await supabase.rpc('get_transactions', {
      p_company_id: companyId,
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

    console.log('testGetTransactions: RPC result', { rpcError, dataLength: data?.length })

    return { success: true, data: data?.length || 0, companyId }
  } catch (error) {
    console.error('testGetTransactions: Exception', error)
    return { success: false, error: String(error) }
  }
}