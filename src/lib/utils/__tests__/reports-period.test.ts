import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatReportsPeriodLabel,
  parseReportsRange,
  reportsPeriodHint,
  reportsPeriodHref,
  resolveReportsPeriod,
} from '../reports-period'

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

describe('parseReportsRange', () => {
  it('devuelve mes para preset desconocido o vacío', () => {
    expect(parseReportsRange(null)).toBe('mes')
    expect(parseReportsRange(undefined)).toBe('mes')
    expect(parseReportsRange('invalid')).toBe('mes')
  })

  it('acepta presets válidos', () => {
    expect(parseReportsRange('trimestre')).toBe('trimestre')
    expect(parseReportsRange('trim_anterior')).toBe('trim_anterior')
    expect(parseReportsRange('hoy')).toBe('hoy')
    expect(parseReportsRange('esta_semana')).toBe('esta_semana')
  })
})

describe('resolveReportsPeriod distribuidora', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resuelve hoy', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-01T15:00:00Z'))

    const { start, end, key } = resolveReportsPeriod('hoy')
    expect(key).toBe('hoy')
    expect(start.getDate()).toBe(end.getDate())
  })

  it('resuelve esta semana (lun–dom)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-01T15:00:00Z')) // miércoles

    const { start, end, key } = resolveReportsPeriod('esta_semana')
    expect(key).toBe('esta_semana')
    expect(start.getDay()).toBe(1)
    expect(end.getDay()).toBe(0)
  })
})

describe('reportsPeriodHref', () => {
  it('omite query en mes actual', () => {
    expect(reportsPeriodHref('/reportes', 'mes')).toBe('/reportes')
    expect(reportsPeriodHref('/proyectos/abc', 'mes')).toBe('/proyectos/abc')
  })

  it('añade rango para otros presets', () => {
    expect(reportsPeriodHref('/reportes', 'mes_anterior')).toBe(
      '/reportes?rango=mes_anterior'
    )
    expect(reportsPeriodHref('/proyectos/abc', 'trimestre')).toBe(
      '/proyectos/abc?rango=trimestre'
    )
  })
})

describe('reportsPeriodHint', () => {
  it('describe cada preset', () => {
    expect(reportsPeriodHint('mes')).toMatch(/mes calendario en curso/i)
    expect(reportsPeriodHint('trimestre')).toMatch(/trimestre civil en curso/i)
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
