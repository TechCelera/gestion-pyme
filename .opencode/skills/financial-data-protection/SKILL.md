---
name: financial-data-protection
description: Rules for protecting financial data in a PYME management system. Soft delete, audit trails, period closing, validation, RLS policies.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  domain: fintech
---

## What I do

Enforce data protection rules for a financial management system where data loss = critical failure.

## When to use me

Apply these rules whenever creating database schemas, API endpoints, or data operations in the Gestion PYME Pro project.

## Core Rules

### 1. Soft Delete - NEVER physically delete data

- Every table MUST have `deleted_at` (timestamptz, nullable) and `deleted_by` (uuid, nullable, references auth.users)
- Instead of DELETE, always use UPDATE to set deleted_at and deleted_by
- All queries MUST filter out deleted records with `WHERE deleted_at IS NULL`
- Only the SuperAdmin can restore deleted records (set deleted_at = NULL)
- Add a `restore()` method in every repository

### 2. Audit Trail - Track every change

- Every table MUST have: `created_at`, `updated_at`, `created_by`, `updated_by`
- Use Supabase triggers to auto-populate these fields
- Create an `audit_log` table that records: table_name, record_id, action (INSERT/UPDATE/DELETE), old_values (jsonb), new_values (jsonb), user_id, timestamp
- The audit_log is APPEND-ONLY - never update or delete audit records

### 3. Row Level Security (RLS) - Multi-tenant isolation

- Enable RLS on EVERY table that contains company data
- Every company table MUST have a `company_id` column
- RLS policy: users can ONLY see data where company_id matches their company
- Use `auth.jwt() -> 'company_id'` in RLS policies
- Force RLS even for table owners: `ALTER TABLE ... FORCE ROW LEVEL SECURITY`
- Role-based RLS: superadmin sees all, admin_finanzas sees all company data, others see only their area

### 4. Data Validation - Never trust client input

- Use Zod schemas for ALL API inputs
- Amounts MUST be positive (greater than 0)
- Dates MUST NOT be in the future for transactions
- Category types MUST match the transaction type
- Currency MUST be one of the supported currencies
- Period closing: once a month is closed, NO modifications allowed to transactions in that period

### 5. Period Closing - Immutable historical data

- Create a `periods` table with: company_id, year, month, status (open/closed), closed_by, closed_at
- When a period is closed: no INSERT, UPDATE, or DELETE on transactions for that period
- Only SuperAdmin or Admin Finanzas can close periods
- Check period status before ANY write operation on transactions

### 6. Multi-currency handling

- Store amounts in `amount` (numeric(15,2)) and `currency` (varchar(3), ISO 4217)
- Store exchange rate in `exchange_rate` (numeric(10,6)) when converting
- Always keep the original amount and currency, never overwrite
- For reports: convert to base currency using the rate at transaction date