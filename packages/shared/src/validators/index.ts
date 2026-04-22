import { z } from 'zod'

export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  type: z.enum(['income', 'expense']),
  method: z.enum(['accrual', 'cash']),
  amount: z.number().positive('El monto debe ser mayor a cero'),
  currency: z.string().length(3, 'La moneda debe ser un codigo ISO 4217 de 3 letras'),
  exchangeRate: z.number().positive().optional(),
  date: z.date().max(new Date(), 'La fecha no puede ser futura'),
  description: z.string().min(1).max(500),
})

export const createCompanySchema = z.object({
  name: z.string().min(2).max(100),
  currency: z.string().length(3),
})

export const createAccountSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(['cash', 'bank', 'other']),
  currency: z.string().length(3),
})

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(['income', 'cost', 'admin_expense', 'commercial_expense', 'financial_expense']),
})

export const closePeriodSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
})