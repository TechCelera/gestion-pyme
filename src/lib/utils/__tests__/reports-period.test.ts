import { describe, it, expect, vi, afterEach } from 'vitest'
import { resolveReportsPeriod, formatReportsPeriodLabel } from '../reports-period'

describe('resolveReportsPeriod', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resuelve mes calendario actual', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))

    const { start, end, key } = resolveReportsPeriod('mes')
    expect(key).toBe('mes')
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(4)
    expect(start.getDate()).toBe(1)
    expect(end.getFullYear()).toBe(2026)
    expect(end.getMonth()).toBe(4)
    expect(end.getDate()).toBeGreaterThanOrEqual(28)
  })

  it('resuelve mes anterior', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))

    const { start, end, key } = resolveReportsPeriod('mes_anterior')
    expect(key).toBe('mes_anterior')
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(3)
    expect(start.getDate()).toBe(1)
    expect(end.getMonth()).toBe(3)
    expect(end.getDate()).toBeGreaterThanOrEqual(28)
  })

  it('resuelve trimestre civil actual', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))

    const { start, end, key } = resolveReportsPeriod('trimestre')
    expect(key).toBe('trimestre')
    expect(start.getMonth()).toBe(3)
    expect(start.getDate()).toBe(1)
    expect(end.getMonth()).toBe(5)
    expect(end.getDate()).toBeGreaterThanOrEqual(28)
  })

  it('ignora preset desconocido y usa mes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T12:00:00Z'))

    const { key, start } = resolveReportsPeriod('garbage')
    expect(key).toBe('mes')
    expect(start.getMonth()).toBe(0)
  })
})

describe('formatReportsPeriodLabel', () => {
  it('usa un solo mes cuando inicio y fin coinciden', () => {
    const start = new Date(2026, 2, 1)
    const end = new Date(2026, 2, 31)
    const label = formatReportsPeriodLabel(start, end)
    expect(label.toLowerCase()).toContain('marzo')
    expect(label).toContain('2026')
  })

  it('usa rango cuando cruza meses', () => {
    const start = new Date(2026, 3, 1)
    const end = new Date(2026, 5, 30)
    const label = formatReportsPeriodLabel(start, end)
    expect(label).toMatch(/–|—|-/)
  })
})
