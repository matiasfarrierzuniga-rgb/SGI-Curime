export type FinancialMonthInterval = {
  key: string
  label: string
  dateFrom: string
  dateTo: string
}

const COSTA_RICA_OFFSET = '-06:00'

export function financialMonthInterval(month: string): FinancialMonthInterval {
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  if (!match) throw new Error('Mes financiero inválido')
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  if (monthIndex < 0 || monthIndex > 11) throw new Error('Mes financiero inválido')
  const lastDay = String(new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()).padStart(2, '0')
  const currentMonth = String(monthIndex + 1).padStart(2, '0')
  return {
    key: month,
    label: new Intl.DateTimeFormat('es-CR', { month: 'short', year: 'numeric', timeZone: 'America/Costa_Rica' }).format(new Date(`${month}-01T00:00:00${COSTA_RICA_OFFSET}`)),
    dateFrom: `${year}-${currentMonth}-01T00:00:00.000${COSTA_RICA_OFFSET}`,
    dateTo: `${year}-${currentMonth}-${lastDay}T23:59:59.999${COSTA_RICA_OFFSET}`,
  }
}

export function financialMonthSeries(month: string, count = 6): FinancialMonthInterval[] {
  const [year, monthNumber] = month.split('-').map(Number)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, monthNumber - 1 - (count - 1 - index), 1))
    return financialMonthInterval(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`)
  })
}

export function currentFinancialMonth(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica', year: 'numeric', month: '2-digit' }).formatToParts()
  const part = (type: string) => parts.find(item => item.type === type)?.value
  return `${part('year')}-${part('month')}`
}

export function moneyToMinorUnits(value: string): bigint {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value)
  if (!match) throw new Error('Monto monetario inválido')
  const minor = `${match[2]}${(match[3] ?? '').padEnd(2, '0')}`
  return BigInt(`${match[1]}${minor}`)
}

export function minorUnitsToMoney(value: bigint): string {
  const negative = value < 0n
  const absolute = (negative ? -value : value).toString().padStart(3, '0')
  return `${negative ? '-' : ''}${absolute.slice(0, -2)}.${absolute.slice(-2)}`
}

export function chartValue(value: string): number | null {
  const units = moneyToMinorUnits(value)
  const limit = BigInt(Number.MAX_SAFE_INTEGER) * 100n
  return units > limit || units < -limit ? null : Number(units) / 100
}
