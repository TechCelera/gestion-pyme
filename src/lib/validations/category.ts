import { z } from 'zod'

export const CategoryTypeSchema = z.enum(['income', 'expense'])

export type CategoryType = z.infer<typeof CategoryTypeSchema>

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  type: CategoryTypeSchema,
})

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  type: CategoryTypeSchema.optional(),
})

/** Normaliza valores legacy (cost, admin_expense, …) a expense. */
export function normalizeCategoryType(type: string): CategoryType {
  return type === 'income' ? 'income' : 'expense'
}
