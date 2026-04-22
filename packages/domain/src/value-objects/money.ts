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
    return new Money(Math.round((this.amount + other.amount) * 100) / 100, this.currency)
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) throw new CurrencyMismatchError()
    return new Money(Math.round((this.amount - other.amount) * 100) / 100, this.currency)
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.amount * factor * 100) / 100, this.currency)
  }

  isNegative(): boolean {
    return this.amount < 0
  }

  format(): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount)
  }
}

export class Percentage {
  private constructor(public readonly value: number) {}

  static create(value: number): Percentage {
    if (value < -100) throw new InvalidPercentageError()
    return new Percentage(Math.round(value * 100) / 100)
  }

  format(): string {
    return `${this.value}%`
  }
}

export class InvalidAmountError extends Error {
  constructor() {
    super('Amount must be greater than zero')
    this.name = 'InvalidAmountError'
  }
}

export class InvalidCurrencyError extends Error {
  constructor() {
    super('Currency must be a valid 3-letter ISO 4217 code')
    this.name = 'InvalidCurrencyError'
  }
}

export class CurrencyMismatchError extends Error {
  constructor() {
    super('Cannot operate on money with different currencies')
    this.name = 'CurrencyMismatchError'
  }
}

export class InvalidPercentageError extends Error {
  constructor() {
    super('Percentage cannot be less than -100')
    this.name = 'InvalidPercentageError'
  }
}