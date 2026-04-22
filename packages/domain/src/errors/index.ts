export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`)
    this.name = 'NotFoundError'
  }
}

export class AlreadyExistsError extends Error {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} with ${field} "${value}" already exists`)
    this.name = 'AlreadyExistsError'
  }
}

export class ClosedPeriodError extends Error {
  constructor(year: number, month: number) {
    super(`Period ${month}/${year} is closed and cannot be modified`)
    this.name = 'ClosedPeriodError'
  }
}

export class UnauthorizedError extends Error {
  constructor(action: string) {
    super(`Not authorized to perform: ${action}`)
    this.name = 'UnauthorizedError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Error thrown when attempting to modify a transaction in a closed period
 */
export class PeriodClosedError extends Error {
  constructor(year: number, month: number) {
    super(`Period ${month}/${year} is closed and cannot be modified`)
    this.name = 'PeriodClosedError'
  }
}

/**
 * Error thrown when attempting an invalid status transition
 */
export class InvalidTransitionError extends Error {
  constructor(fromStatus: string, toStatus: string) {
    super(`Cannot transition from "${fromStatus}" to "${toStatus}"`)
    this.name = 'InvalidTransitionError'
  }
}

/**
 * Error thrown when a transaction is not found
 */
export class TransactionNotFoundError extends Error {
  constructor(id: string) {
    super(`Transaction with id ${id} not found`)
    this.name = 'TransactionNotFoundError'
  }
}

/**
 * Error thrown when attempting to access a deleted transaction
 */
export class TransactionDeletedError extends Error {
  constructor(id: string) {
    super(`Transaction with id ${id} has been deleted`)
    this.name = 'TransactionDeletedError'
  }
}

/**
 * Error thrown when attempting to modify a posted transaction
 */
export class PostedImmutableError extends Error {
  constructor() {
    super('Posted transactions cannot be modified')
    this.name = 'PostedImmutableError'
  }
}

/**
 * Error thrown when rejection reason is missing for rejection action
 */
export class MissingRejectionReasonError extends Error {
  constructor() {
    super('Rejection reason is required when rejecting a transaction')
    this.name = 'MissingRejectionReasonError'
  }
}

/**
 * Error thrown when user is not authorized to perform an action
 */
export class NotAuthorizedError extends Error {
  constructor(action: string) {
    super(`Not authorized to perform: ${action}`)
    this.name = 'NotAuthorizedError'
  }
}