export const COSTA_RICA_TIME_ZONE = 'America/Costa_Rica'

export type CalendarDay = { date: Date; key: string; current: boolean }

export function civilDateKey(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function calendarKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: COSTA_RICA_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value))
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function currentCostaRicaMonth() {
  const [year, month] = calendarKey(new Date()).split('-').map(Number)
  return new Date(year, month - 1, 1)
}

export function calendarMonthDays(month: Date): CalendarDay[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - offset)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    return { date, key: civilDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate()), current: date.getMonth() === month.getMonth() }
  })
}

export function formatCalendarDate(value: string | Date, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }) {
  return new Intl.DateTimeFormat('es-CR', { ...options, timeZone: COSTA_RICA_TIME_ZONE }).format(new Date(value))
}

export function moveCalendarMonth(month: Date, offset: number) {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1)
}
