import type { PeriodRepository } from '../repositories'
import { ClosedPeriodError, UnauthorizedError } from '../errors'
import type { UserRole } from '../entities'

interface ClosePeriodInput {
  readonly companyId: string
  readonly year: number
  readonly month: number
  readonly closedBy: string
  readonly userRole: UserRole
}

export async function closePeriod(
  input: ClosePeriodInput,
  periodRepo: PeriodRepository
): Promise<void> {
  // Only superadmin or admin_finanzas can close periods
  if (input.userRole !== 'superadmin' && input.userRole !== 'admin_finanzas') {
    throw new UnauthorizedError('close period')
  }

  const period = await periodRepo.findByCompanyAndMonth(input.companyId, input.year, input.month)
  if (period && period.status === 'closed') {
    throw new ClosedPeriodError(input.year, input.month)
  }

  if (period) {
    await periodRepo.close(period.id, input.closedBy)
  } else {
    // Create the period first if it doesn't exist
    const newPeriod = await periodRepo.save({
      id: crypto.randomUUID(),
      companyId: input.companyId,
      year: input.year,
      month: input.month,
      status: 'open',
      closedBy: null,
      closedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await periodRepo.close(newPeriod.id, input.closedBy)
  }
}