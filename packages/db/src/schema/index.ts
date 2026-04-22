import { pgTable, uuid, varchar, numeric, timestamp, boolean, integer, jsonb, date } from 'drizzle-orm/pg-core'

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  email: varchar('email', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('vendedor'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  balance: numeric('balance', { precision: 15, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
})

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 25 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
})

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  accountId: uuid('account_id').references(() => accounts.id),
  categoryId: uuid('category_id').references(() => categories.id),
  type: varchar('type', { length: 15 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  status: varchar('status', { length: 10 }).notNull().default('draft'),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  exchangeRate: numeric('exchange_rate', { precision: 10, scale: 6 }),
  date: date('date').notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  // Contact fields
  contactId: uuid('contact_id'),
  contactType: varchar('contact_type', { length: 15 }),
  // Transfer fields
  sourceAccountId: uuid('source_account_id'),
  destinationAccountId: uuid('destination_account_id'),
  // Adjustment fields
  adjustmentReason: varchar('adjustment_reason', { length: 20 }),
  // Document fields
  documentType: varchar('document_type', { length: 15 }),
  documentNumber: varchar('document_number', { length: 50 }),
  attachmentUrl: varchar('attachment_url', { length: 500 }),
  // Workflow metadata
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  postedBy: uuid('posted_by'),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  rejectedBy: uuid('rejected_by'),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  rejectionReason: varchar('rejection_reason', { length: 500 }),
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
})

export const periods = pgTable('periods', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  status: varchar('status', { length: 10 }).notNull().default('open'),
  closedBy: uuid('closed_by'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  tableName: varchar('table_name', { length: 50 }).notNull(),
  recordId: uuid('record_id').notNull(),
  action: varchar('action', { length: 10 }).notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})