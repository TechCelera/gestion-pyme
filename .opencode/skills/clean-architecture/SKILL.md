---
name: clean-architecture
description: Enforce Clean Architecture and Domain-Driven Design patterns for the Gestion PYME Pro project. Layer separation, dependency rules, naming conventions.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  domain: architecture
---

## What I do

Enforce Clean Architecture and DDD patterns for a financial management system where code must be clean, maintainable, and testable.

## When to use me

Apply these rules when creating new files, folders, functions, or classes in the Gestion PYME Pro project.

## Project Structure

```
gestion-pyme/
├── apps/
│   └── web/                    # Next.js PWA app (presentation layer)
│       ├── app/                # Next.js App Router pages
│       ├── components/         # UI components (shadcn/ui based)
│       ├── hooks/              # Custom React hooks
│       └── lib/                # App-specific utilities
│
├── packages/
│   ├── domain/                 # Core business logic (no dependencies!)
│   │   ├── entities/           # Business entities (Company, User, Transaction...)
│   │   ├── value-objects/      # Immutable value objects (Money, Percentage, Period...)
│   │   ├── use-cases/          # Application use cases (one file per use case)
│   │   ├── repositories/       # Repository INTERFACES (not implementations)
│   │   └── errors/             # Domain-specific errors
│   │
│   ├── db/                     # Database layer (implements domain interfaces)
│   │   ├── schema/             # Drizzle ORM table definitions
│   │   ├── migrations/         # SQL migrations
│   │   ├── repositories/       # Repository IMPLEMENTATIONS
│   │   └── rls/                # RLS policy SQL files
│   │
│   └── shared/                 # Shared utilities
│       ├── auth/               # Auth helpers
│       ├── format/             # Currency, date, number formatting
│       ├── validators/         # Zod schemas (reused across packages)
│       └── types/              # Shared TypeScript types
│
├── .opencode/                  # OpenCode config and skills
└── turbo.json                  # Turborepo config
```

## Dependency Rules (CRITICAL)

1. **domain** depends on NOTHING. Zero external dependencies. Only TypeScript.
2. **db** depends on **domain** (implements repository interfaces)
3. **shared** depends on NOTHING external (only Zod for validators)
4. **web** depends on **domain** and **db** and **shared**

NEVER:
- Import from `db` inside `domain`
- Import from `web` inside `domain` or `db`
- Import from `db` inside `shared`

## Naming Conventions

### Files
- Entities: `company.ts`, `transaction.ts`
- Value objects: `money.ts`, `percentage.ts`
- Use cases: `create-transaction.ts`, `close-period.ts`
- Repository interfaces: `transaction-repository.ts`
- Repository implementations: `supabase-transaction-repository.ts`
- Components: `transaction-form.tsx`, `dashboard-card.tsx`
- Hooks: `use-transactions.ts`, `use-auth.ts`

### Variables and Functions (TypeScript)
- Variables: camelCase (`monthlyRevenue`, `companyId`)
- Functions: camelCase (`calculateNetIncome`, `validatePeriod`)
- Classes: PascalCase (`TransactionRepository`, `Money`)
- Interfaces: PascalCase with `I` prefix NOT allowed. Use descriptive names (`TransactionRepository` not `ITransactionRepository`)
- Types: PascalCase (`TransactionType`, `PeriodStatus`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_TRANSACTIONS_PER_PAGE`)
- Zod schemas: camelCase with `Schema` suffix (`createTransactionSchema`)
- Database columns: snake_case (`company_id`, `created_at`)
- API routes: kebab-case (`/api/create-transaction`)

### Comments
- ONLY add comments when the WHY is not obvious from the code
- Keep comments SHORT and CLEAR
- Example: `// Use percibido method for cash flow (money in/out as it happens)`
- Do NOT comment obvious things: `// Set the name` or `// Loop through items`

## Entity Pattern

```typescript
// packages/domain/entities/transaction.ts

export type TransactionType = 'income' | 'expense'
export type TransactionMethod = 'accrual' | 'cash'

export interface Transaction {
  readonly id: string
  readonly companyId: string
  readonly amount: Money
  readonly type: TransactionType
  readonly method: TransactionMethod
  readonly category: string
  readonly accountId: string
  readonly date: Date
  readonly description: string
  readonly deletedAt: null | Date
  readonly createdAt: Date
  readonly updatedAt: Date
}
```

## Use Case Pattern

One use case = one file. One function. One responsibility.

```typescript
// packages/domain/use-cases/create-transaction.ts

export function createTransaction(
  input: CreateTransactionInput,
  repository: TransactionRepository
): Promise<CreateTransactionOutput> {
  validateTransactionInput(input)
  const transaction = buildTransaction(input)
  return repository.save(transaction)
}
```

## Value Object Pattern

```typescript
// packages/domain/value-objects/money.ts

export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {}

  static create(amount: number, currency: string): Money {
    if (amount <= 0) throw new InvalidAmountError()
    if (currency.length !== 3) throw new InvalidCurrencyError()
    return new Money(Math.round(amount * 100) / 100, currency.toUpperCase())
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new CurrencyMismatchError()
    return new Money(this.amount + other.amount, this.currency)
  }
}
```

## Code Principles

1. **No code without purpose**: If a function isn't called, don't write it
2. **No library without reason**: Every dependency must justify its existence
3. **Reuse before create**: Check shared/ and packages/ before writing new utilities
4. **Small functions**: If a function exceeds 30 lines, split it
5. **Single responsibility**: One file = one concept
6. **Explicit over implicit**: No implicit any, no magic numbers, no hidden side effects