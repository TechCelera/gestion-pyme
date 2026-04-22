import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Transaction,
  TransactionRepository,
  TransactionFilters,
  TransactionStatus,
} from '@gestion-pyme/domain'

/**
 * Supabase implementation of TransactionRepository
 * Uses Supabase RPC functions and direct table operations
 */
export class SupabaseTransactionRepository implements TransactionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(transaction: Transaction): Promise<Transaction> {
    const { data, error } = await this.client
      .from('transactions')
      .insert(this.toDbRow(transaction))
      .select()
      .single()

    if (error) throw new Error(`Failed to create transaction: ${error.message}`)
    return this.toEntity(data)
  }

  async findById(id: string): Promise<Transaction | null> {
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw new Error(`Failed to find transaction: ${error.message}`)
    }

    return data ? this.toEntity(data) : null
  }

  async findByCompany(companyId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    let query = this.client
      .from('transactions')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)

    if (filters) {
      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom.toISOString().split('T')[0])
      }
      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo.toISOString().split('T')[0])
      }
      if (filters.type) {
        if (Array.isArray(filters.type)) {
          query = query.in('type', filters.type)
        } else {
          query = query.eq('type', filters.type)
        }
      }
      if (filters.method) {
        query = query.eq('method', filters.method)
      }
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId)
      }
      if (filters.contactId) {
        query = query.eq('contact_id', filters.contactId)
      }
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }
    }

    const { data, error } = await query.order('date', { ascending: false })

    if (error) throw new Error(`Failed to find transactions: ${error.message}`)
    return (data || []).map(row => this.toEntity(row))
  }

  async findByCompanyId(companyId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    return this.findByCompany(companyId, filters)
  }

  async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const { data: result, error } = await this.client
      .from('transactions')
      .update({
        ...this.toDbRowPartial(data),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update transaction: ${error.message}`)
    return this.toEntity(result)
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    userId: string,
    reason?: string
  ): Promise<Transaction> {
    const updates: Record<string, unknown> = { status }

    // Set workflow timestamps based on status
    if (status === 'approved') {
      updates.approved_by = userId
      updates.approved_at = new Date().toISOString()
    } else if (status === 'posted') {
      updates.posted_by = userId
      updates.posted_at = new Date().toISOString()
    } else if (status === 'rejected') {
      updates.rejected_by = userId
      updates.rejected_at = new Date().toISOString()
      if (reason) updates.rejection_reason = reason
    }

    const { data, error } = await this.client
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update status: ${error.message}`)
    return this.toEntity(data)
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('transactions')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
      })
      .eq('id', id)

    if (error) throw new Error(`Failed to delete transaction: ${error.message}`)
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    return this.delete(id, deletedBy)
  }

  async restore(id: string): Promise<void> {
    const { error } = await this.client
      .from('transactions')
      .update({
        deleted_at: null,
        deleted_by: null,
      })
      .eq('id', id)

    if (error) throw new Error(`Failed to restore transaction: ${error.message}`)
  }

  async save(transaction: Transaction): Promise<Transaction> {
    if (transaction.id) {
      return this.update(transaction.id, transaction)
    }
    return this.create(transaction)
  }

  async count(companyId: string, filters?: TransactionFilters): Promise<number> {
    let query = this.client
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .is('deleted_at', null)

    if (filters) {
      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom.toISOString().split('T')[0])
      }
      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo.toISOString().split('T')[0])
      }
      if (filters.type) {
        if (Array.isArray(filters.type)) {
          query = query.in('type', filters.type)
        } else {
          query = query.eq('type', filters.type)
        }
      }
      if (filters.method) {
        query = query.eq('method', filters.method)
      }
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId)
      }
      if (filters.contactId) {
        query = query.eq('contact_id', filters.contactId)
      }
    }

    const { count, error } = await query

    if (error) throw new Error(`Failed to count transactions: ${error.message}`)
    return count || 0
  }

  /**
   * Convert domain entity to database row
   */
  private toDbRow(transaction: Transaction): Record<string, unknown> {
    return {
      id: transaction.id,
      company_id: transaction.companyId,
      account_id: transaction.accountId,
      category_id: transaction.categoryId,
      type: transaction.type,
      method: transaction.method,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      exchange_rate: transaction.exchangeRate,
      date: transaction.date.toISOString().split('T')[0],
      description: transaction.description,
      contact_id: transaction.contactId,
      contact_type: transaction.contactType,
      source_account_id: transaction.sourceAccountId,
      destination_account_id: transaction.destinationAccountId,
      adjustment_reason: transaction.adjustmentReason,
      document_type: transaction.documentType,
      document_number: transaction.documentNumber,
      attachment_url: transaction.attachmentUrl,
      created_by: transaction.createdBy,
      updated_by: transaction.updatedBy,
      approved_by: transaction.approvedBy,
      approved_at: transaction.approvedAt?.toISOString(),
      posted_by: transaction.postedBy,
      posted_at: transaction.postedAt?.toISOString(),
      rejected_by: transaction.rejectedBy,
      rejected_at: transaction.rejectedAt?.toISOString(),
      rejection_reason: transaction.rejectionReason,
      created_at: transaction.createdAt.toISOString(),
      updated_at: transaction.updatedAt.toISOString(),
      deleted_at: transaction.deletedAt?.toISOString() || null,
      deleted_by: transaction.deletedBy,
    }
  }

  /**
   * Convert partial domain entity to database row updates
   */
  private toDbRowPartial(data: Partial<Transaction>): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    if (data.accountId !== undefined) result.account_id = data.accountId
    if (data.categoryId !== undefined) result.category_id = data.categoryId
    if (data.type !== undefined) result.type = data.type
    if (data.method !== undefined) result.method = data.method
    if (data.status !== undefined) result.status = data.status
    if (data.amount !== undefined) result.amount = data.amount
    if (data.currency !== undefined) result.currency = data.currency
    if (data.exchangeRate !== undefined) result.exchange_rate = data.exchangeRate
    if (data.date !== undefined) result.date = data.date.toISOString().split('T')[0]
    if (data.description !== undefined) result.description = data.description
    if (data.contactId !== undefined) result.contact_id = data.contactId
    if (data.contactType !== undefined) result.contact_type = data.contactType
    if (data.sourceAccountId !== undefined) result.source_account_id = data.sourceAccountId
    if (data.destinationAccountId !== undefined) result.destination_account_id = data.destinationAccountId
    if (data.adjustmentReason !== undefined) result.adjustment_reason = data.adjustmentReason
    if (data.documentType !== undefined) result.document_type = data.documentType
    if (data.documentNumber !== undefined) result.document_number = data.documentNumber
    if (data.attachmentUrl !== undefined) result.attachment_url = data.attachmentUrl
    if (data.updatedBy !== undefined) result.updated_by = data.updatedBy

    return result
  }

  /**
   * Convert database row to domain entity
   */
  private toEntity(row: Record<string, unknown>): Transaction {
    return {
      id: row.id as string,
      companyId: row.company_id as string,
      accountId: (row.account_id as string | null) || '',
      categoryId: row.category_id as string | null,
      type: row.type as Transaction['type'],
      method: row.method as Transaction['method'],
      status: (row.status as TransactionStatus) || 'draft',
      amount: Number(row.amount),
      currency: row.currency as string,
      exchangeRate: row.exchange_rate ? Number(row.exchange_rate) : null,
      date: new Date(row.date as string),
      description: row.description as string,
      contactId: row.contact_id as string | null,
      contactType: row.contact_type as Transaction['contactType'],
      sourceAccountId: row.source_account_id as string | null,
      destinationAccountId: row.destination_account_id as string | null,
      adjustmentReason: row.adjustment_reason as Transaction['adjustmentReason'],
      documentType: row.document_type as Transaction['documentType'],
      documentNumber: row.document_number as string | null,
      attachmentUrl: row.attachment_url as string | null,
      createdBy: row.created_by as string,
      updatedBy: row.updated_by as string,
      approvedBy: row.approved_by as string | null,
      approvedAt: row.approved_at ? new Date(row.approved_at as string) : null,
      postedBy: row.posted_by as string | null,
      postedAt: row.posted_at ? new Date(row.posted_at as string) : null,
      rejectedBy: row.rejected_by as string | null,
      rejectedAt: row.rejected_at ? new Date(row.rejected_at as string) : null,
      rejectionReason: row.rejection_reason as string | null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
      deletedBy: row.deleted_by as string | null,
    }
  }
}
