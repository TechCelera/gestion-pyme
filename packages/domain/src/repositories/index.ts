import type { Transaction, Period } from '../entities'
import type { TransactionStatus } from '../entities/transaction'
import type { Money } from '../value-objects'

/**
 * Filters for querying transactions
 */
export interface TransactionFilters {
  readonly dateFrom?: Date
  readonly dateTo?: Date
  readonly type?: Transaction['type'] | Transaction['type'][]
  readonly method?: Transaction['method']
  readonly status?: TransactionStatus | TransactionStatus[]
  readonly categoryId?: string
  readonly accountId?: string
  readonly contactId?: string
  readonly search?: string
  readonly limit?: number
  readonly offset?: number
}

/**
 * Repository interface for Transaction entity
 */
export interface TransactionRepository {
  /**
   * Create a new transaction
   */
  create(transaction: Transaction): Promise<Transaction>

  /**
   * Find a transaction by its ID
   */
  findById(id: string): Promise<Transaction | null>

  /**
   * Find all transactions for a company with optional filters
   */
  findByCompany(companyId: string, filters?: TransactionFilters): Promise<Transaction[]>

  /**
   * Find transactions by company ID (legacy alias for findByCompany)
   */
  findByCompanyId(companyId: string, filters?: TransactionFilters): Promise<Transaction[]>

  /**
   * Update a transaction by ID
   */
  update(id: string, data: Partial<Transaction>): Promise<Transaction>

  /**
   * Update transaction status with metadata
   */
  updateStatus(
    id: string,
    status: TransactionStatus,
    userId: string,
    reason?: string
  ): Promise<Transaction>

  /**
   * Soft delete a transaction
   */
  delete(id: string, userId: string): Promise<void>

  /**
   * Legacy soft delete method
   */
  softDelete(id: string, deletedBy: string): Promise<void>

  /**
   * Restore a soft-deleted transaction
   */
  restore(id: string): Promise<void>

  /**
   * Save a transaction (create or update)
   */
  save(transaction: Transaction): Promise<Transaction>

  /**
   * Count transactions for a company with optional filters
   */
  count(companyId: string, filters?: TransactionFilters): Promise<number>
}

export interface PeriodRepository {
  findById(id: string): Promise<Period | null>
  findByCompanyAndMonth(companyId: string, year: number, month: number): Promise<Period | null>
  findOpenByCompany(companyId: string): Promise<Period[]>
  save(period: Period): Promise<Period>
  close(id: string, closedBy: string): Promise<Period>
}

export interface AccountRepository {
  findById(id: string): Promise<unknown | null>
  findByCompanyId(companyId: string): Promise<unknown[]>
}

export interface CategoryRepository {
  findById(id: string): Promise<unknown | null>
  findByCompanyId(companyId: string): Promise<unknown[]>
}

export interface CompanyRepository {
  findById(id: string): Promise<unknown | null>
}

export interface AuditLogRepository {
  save(log: unknown): Promise<void>
  findByRecord(tableName: string, recordId: string): Promise<unknown[]>
}

export interface ReportRepository {
  getIncomeStatement(companyId: string, year: number, month: number): Promise<IncomeStatement>
  getCashFlow(companyId: string, dateFrom: Date, dateTo: Date): Promise<CashFlow>
}



export interface IncomeStatement {
  readonly revenue: Money
  readonly variableCosts: Money
  readonly contributionMargin: Money
  readonly adminExpenses: Money
  readonly commercialExpenses: Money
  readonly financialExpenses: Money
  readonly grossProfit: Money
  readonly netProfit: Money
}

export interface CashFlow {
  readonly inflows: Money
  readonly outflows: Money
  readonly netFlow: Money
}