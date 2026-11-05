import { describe, expect, it } from 'vitest'
import { chartValue, financialMonthInterval, financialMonthSeries, minorUnitsToMoney, moneyToMinorUnits } from './financialDashboard'

describe('financial dashboard periods', () => {
  it('creates inclusive Costa Rica month limits without overlap', () => {
    const january = financialMonthInterval('2026-01')
    const february = financialMonthInterval('2026-02')

    expect(january.dateFrom).toBe('2026-01-01T00:00:00.000-06:00')
    expect(january.dateTo).toBe('2026-01-31T23:59:59.999-06:00')
    expect(february.dateFrom).toBe('2026-02-01T00:00:00.000-06:00')
  })

  it('builds six consecutive intervals through a year boundary', () => {
    expect(financialMonthSeries('2026-02').map(item => item.key)).toEqual(['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02'])
  })
})

describe('financial dashboard money precision', () => {
  it('preserves decimal values through minor units', () => {
    expect(moneyToMinorUnits('1234.50') + moneyToMinorUnits('0.05')).toBe(123455n)
    expect(minorUnitsToMoney(-50n)).toBe('-0.50')
  })

  it('rejects invalid values and avoids unsafe chart values', () => {
    expect(() => moneyToMinorUnits('12.345')).toThrow('Monto monetario inválido')
    expect(chartValue('9007199254740992.00')).toBeNull()
  })
})
