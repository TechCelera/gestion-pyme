'use server'

import { createClient } from '@/lib/supabase/server'

export interface Project {
  id: string
  name: string
  companyId: string
  parentProjectId: string | null
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  budgetAmount: number
  startDate: string | null
  endDate: string | null
  spentAmount?: number
  children?: Project[]
}

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

async function getCurrentUserCompany(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const appMeta = user.app_metadata as Record<string, unknown>
    if (appMeta?.company_id) return appMeta.company_id as string
    if (user.user_metadata?.company_id) return user.user_metadata.company_id as string

    const { data } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    return data?.company_id ?? null
  } catch {
    return null
  }
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return user.id
  } catch {
    return null
  }
}

function buildProjectTree(items: Project[], parentId: string | null = null): Project[] {
  return items
    .filter((item) => item.parentProjectId === parentId)
    .map((item) => ({
      ...item,
      children: buildProjectTree(items, item.id),
    }))
}

export async function getProjects(): Promise<ActionResult<Project[]>> {
  try {
    const companyId = await getCurrentUserCompany()
    if (!companyId) return { success: false, error: 'Usuario no autenticado o sin empresa' }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('projects')
      .select('id, company_id, parent_project_id, name, status, budget_amount, start_date, end_date')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at')

    if (error) return { success: false, error: error.message }

    const projects = (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      companyId: row.company_id as string,
      parentProjectId: (row.parent_project_id as string | null) ?? null,
      status: (row.status as Project['status']) ?? 'active',
      budgetAmount: Number(row.budget_amount ?? 0),
      startDate: (row.start_date as string | null) ?? null,
      endDate: (row.end_date as string | null) ?? null,
      spentAmount: 0,
    }))

    const { data: expenses } = await supabase
      .from('transactions')
      .select('project_id, amount')
      .eq('company_id', companyId)
      .eq('type', 'expense')
      .eq('status', 'posted')
      .is('deleted_at', null)
      .not('project_id', 'is', null)

    const spentByProject = new Map<string, number>()
    for (const row of expenses ?? []) {
      const projectId = (row.project_id as string | null) ?? null
      if (!projectId) continue
      const amount = Number(row.amount ?? 0)
      spentByProject.set(projectId, (spentByProject.get(projectId) ?? 0) + amount)
    }

    for (const project of projects) {
      project.spentAmount = spentByProject.get(project.id) ?? 0
    }

    return { success: true, data: buildProjectTree(projects) }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Error desconocido' }
  }
}

export async function createProject(input: {
  name: string
  parentProjectId?: string | null
  budgetAmount: number
  startDate?: string | null
  endDate?: string | null
}): Promise<ActionResult<Project>> {
  try {
    const [companyId, userId] = await Promise.all([getCurrentUserCompany(), getCurrentUserId()])
    if (!companyId || !userId) return { success: false, error: 'Usuario no autenticado o sin empresa' }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('projects')
      .insert({
        company_id: companyId,
        parent_project_id: input.parentProjectId ?? null,
        name: input.name,
        budget_amount: input.budgetAmount,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        created_by: userId,
        updated_by: userId,
      })
      .select('id, company_id, parent_project_id, name, status, budget_amount, start_date, end_date')
      .single()

    if (error || !data) return { success: false, error: error?.message ?? 'No se pudo crear el proyecto' }

    return {
      success: true,
      data: {
        id: data.id as string,
        name: data.name as string,
        companyId: data.company_id as string,
        parentProjectId: (data.parent_project_id as string | null) ?? null,
        status: (data.status as Project['status']) ?? 'active',
        budgetAmount: Number(data.budget_amount ?? 0),
        startDate: (data.start_date as string | null) ?? null,
        endDate: (data.end_date as string | null) ?? null,
      },
    }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Error desconocido' }
  }
}

export async function updateProject(
  id: string,
  input: {
    name: string
    parentProjectId?: string | null
    budgetAmount: number
    startDate?: string | null
    endDate?: string | null
    status?: Project['status']
  }
): Promise<ActionResult> {
  try {
    const [companyId, userId] = await Promise.all([getCurrentUserCompany(), getCurrentUserId()])
    if (!companyId || !userId) return { success: false, error: 'Usuario no autenticado o sin empresa' }

    if (!input.name.trim()) {
      return { success: false, error: 'El nombre del proyecto es requerido' }
    }

    if (input.parentProjectId && input.parentProjectId === id) {
      return { success: false, error: 'Un proyecto no puede ser su propio padre' }
    }

    const supabase = await createClient()

    const { data: current, error: currentError } = await supabase
      .from('projects')
      .select('id, parent_project_id')
      .eq('id', id)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .single()

    if (currentError || !current) {
      return { success: false, error: currentError?.message ?? 'Proyecto no encontrado' }
    }

    const { error } = await supabase
      .from('projects')
      .update({
        name: input.name.trim(),
        parent_project_id: input.parentProjectId ?? null,
        budget_amount: input.budgetAmount,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        status: input.status ?? 'active',
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Error desconocido' }
  }
}
