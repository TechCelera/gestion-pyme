import { createClient } from '@/lib/supabase/server'

interface ProjectBudgetContext {
  id: string
  budgetAmount: number
  endDate: string | null
  spentAmount: number
}

export async function getProjectBudgetContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  projectId: string
): Promise<ProjectBudgetContext | null> {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, budget_amount, end_date')
    .eq('id', projectId)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .single()

  if (projectError || !project) {
    return null
  }

  const { data: txRows, error: txError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('company_id', companyId)
    .eq('project_id', projectId)
    .eq('type', 'expense')
    .eq('status', 'approved')
    .is('deleted_at', null)

  if (txError) {
    return null
  }

  const spentAmount = (txRows ?? []).reduce((acc, row) => {
    const amount = Number((row as Record<string, unknown>).amount ?? 0)
    return acc + amount
  }, 0)

  return {
    id: project.id as string,
    budgetAmount: Number(project.budget_amount ?? 0),
    endDate: (project.end_date as string | null) ?? null,
    spentAmount,
  }
}
