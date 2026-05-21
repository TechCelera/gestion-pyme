import { z } from 'zod'

export const ContactKindSchema = z.enum(['client', 'provider'])
export type ContactKind = z.infer<typeof ContactKindSchema>

const phoneSchema = z
  .string()
  .trim()
  .min(6, 'El teléfono debe tener al menos 6 caracteres')
  .max(40, 'Teléfono demasiado largo')
  .regex(/^[\d\s+().-]+$/, 'Teléfono inválido')

const optionalEmailSchema = z
  .string()
  .trim()
  .max(255)
  .refine((v) => v === '' || z.string().email().safeParse(v).success, {
    message: 'Correo inválido',
  })

export const createContactSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(200),
  kind: ContactKindSchema,
  phone: phoneSchema,
  email: optionalEmailSchema.optional(),
  clientSegment: z.string().trim().max(40).nullable().optional(),
  associatedServices: z.string().trim().max(500).nullable().optional(),
  taxId: z.string().trim().max(50).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
})

export const updateContactSchema = createContactSchema.partial().extend({
  name: z.string().trim().min(1).max(200).optional(),
  kind: ContactKindSchema.optional(),
  phone: phoneSchema.optional(),
})

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>

export function normalizeContactEmail(email: string | null | undefined): string | null {
  const trimmed = (email ?? '').trim()
  return trimmed.length > 0 ? trimmed.toLowerCase() : null
}
