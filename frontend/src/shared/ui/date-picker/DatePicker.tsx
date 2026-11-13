import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

type CalendarDate = {
  year: number
  month: number
  day: number
}

type DatePickerProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  disabled?: boolean
  required?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

type DateRangePickerProps = {
  startId?: string
  endId?: string
  startValue: string
  endValue: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  startLabel?: string
  endLabel?: string
  min?: string
  max?: string
  disabled?: boolean
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const DEFAULT_PAST_YEAR_RANGE = 100
const DEFAULT_FUTURE_YEAR_RANGE = 10

function isValidDate(year: number, month: number, day: number) {
  if (year < 1 || month < 1 || month > 12 || day < 1) return false
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function parseIsoDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [, year, month, day] = match
  const parsed = { year: Number(year), month: Number(month), day: Number(day) }
  return isValidDate(parsed.year, parsed.month, parsed.day) ? parsed : null
}

function parseDisplayDate(value: string): CalendarDate | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return null
  const [, day, month, year] = match
  const parsed = { year: Number(year), month: Number(month), day: Number(day) }
  return isValidDate(parsed.year, parsed.month, parsed.day) ? parsed : null
}

function toIsoDate({ year, month, day }: CalendarDate) {
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

function toDisplayDate(date: CalendarDate) {
  return `${date.day.toString().padStart(2, '0')}/${date.month.toString().padStart(2, '0')}/${date.year.toString().padStart(4, '0')}`
}

function formatValue(value: string) {
  const date = parseIsoDate(value)
  return date ? toDisplayDate(date) : ''
}

function today(): CalendarDate {
  const date = new Date()
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }
}

function isWithinLimits(value: string, min?: string, max?: string) {
  return (!min || value >= min) && (!max || value <= max)
}

function isSameDate(first: CalendarDate | null, second: CalendarDate) {
  return Boolean(first && first.year === second.year && first.month === second.month && first.day === second.day)
}

function moveMonth(view: Pick<CalendarDate, 'year' | 'month'>, offset: number) {
  const date = new Date(view.year, view.month - 1 + offset, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

function getAvailableYears(min?: string, max?: string, selected?: CalendarDate | null) {
  const currentYear = today().year
  const minYear = parseIsoDate(min ?? '')?.year
  const maxYear = parseIsoDate(max ?? '')?.year
  const selectedYear = selected?.year ?? currentYear
  const firstYear = minYear ?? (maxYear ? Math.min(maxYear, selectedYear) : Math.min(currentYear, selectedYear)) - DEFAULT_PAST_YEAR_RANGE
  const lastYear = maxYear ?? Math.max(currentYear + DEFAULT_FUTURE_YEAR_RANGE, selectedYear)

  return Array.from({ length: Math.max(0, lastYear - firstYear + 1) }, (_, index) => firstYear + index)
}

function getInitialView(value: string, min?: string, max?: string) {
  const selected = parseIsoDate(value)
  if (selected) return { year: selected.year, month: selected.month }

  const current = today()
  const currentValue = toIsoDate(current)
  const minDate = parseIsoDate(min ?? '')
  const maxDate = parseIsoDate(max ?? '')
  if (minDate && currentValue < toIsoDate(minDate)) return { year: minDate.year, month: minDate.month }
  if (maxDate && currentValue > toIsoDate(maxDate)) return { year: maxDate.year, month: maxDate.month }
  return { year: current.year, month: current.month }
}

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid = false,
}: DatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const restoreFocusRef = useRef(false)
  const calendarId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(() => formatValue(value))
  const [inputInvalid, setInputInvalid] = useState(false)
  const [view, setView] = useState(() => getInitialView(value, min, max))

  useEffect(() => {
    setInputValue(formatValue(value))
    setInputInvalid(false)
  }, [value])

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setIsOpen(false)
      restoreFocusRef.current = true
      requestAnimationFrame(() => inputRef.current?.focus())
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  const openCalendar = () => {
    if (restoreFocusRef.current) {
      restoreFocusRef.current = false
      return
    }
    if (disabled || isOpen) return
    setView(getInitialView(value, min, max))
    setIsOpen(true)
  }

  const closeCalendar = (restoreFocus = false) => {
    setIsOpen(false)
    if (restoreFocus) {
      restoreFocusRef.current = true
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  const selectDate = (date: CalendarDate) => {
    const nextValue = toIsoDate(date)
    if (!isWithinLimits(nextValue, min, max)) return
    setInputValue(toDisplayDate(date))
    setInputInvalid(false)
    onChange(nextValue)
    closeCalendar(true)
  }

  const handleInputChange = (nextInputValue: string) => {
    setInputValue(nextInputValue)
    if (!nextInputValue) {
      setInputInvalid(false)
      onChange('')
      return
    }

    const date = parseDisplayDate(nextInputValue)
    const nextValue = date ? toIsoDate(date) : null
    if (!nextValue || !isWithinLimits(nextValue, min, max)) {
      setInputInvalid(true)
      return
    }

    setInputInvalid(false)
    onChange(nextValue)
  }

  const selectedDate = parseIsoDate(value)
  const currentDate = today()
  const availableYears = getAvailableYears(min, max, selectedDate)
  const firstDayOffset = (new Date(view.year, view.month - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(view.year, view.month, 0).getDate()
  const days = Array.from({ length: Math.ceil((firstDayOffset + daysInMonth) / 7) * 7 }, (_, index) => {
    if (index < firstDayOffset) return null
    return { year: view.year, month: view.month, day: index - firstDayOffset + 1 }
  })

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          placeholder="DD/MM/AAAA"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          required={required}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid || inputInvalid}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? calendarId : undefined}
          className="h-12 w-full min-w-0 rounded-control border border-border-default bg-surface py-2 pr-11 pl-3 text-base text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground hover:border-primary/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
          onFocus={openCalendar}
          onClick={openCalendar}
          onChange={event => handleInputChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' || (event.altKey && event.key === 'ArrowDown')) {
              event.preventDefault()
              openCalendar()
            }
          }}
          onBlur={() => {
            if (inputInvalid) setInputValue(formatValue(value))
          }}
        />
        <button type="button" aria-label="Abrir calendario" disabled={disabled} aria-haspopup="dialog" aria-expanded={isOpen} aria-controls={isOpen ? calendarId : undefined} onClick={openCalendar} className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"><CalendarDays aria-hidden="true" className="size-4" /></button>
      </div>

      {isOpen ? (
        <div
          id={calendarId}
          role="dialog"
          aria-label="Calendario"
          className="absolute top-full right-0 z-30 mt-2 w-[min(20rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] rounded-surface border border-border-subtle bg-surface p-4 shadow-elevation-2"
        >
          <div className="mb-3 grid grid-cols-[2.5rem_minmax(0,1fr)_5.5rem_2.5rem] items-center gap-1">
            <button type="button" aria-label="Mes anterior" className="grid size-10 place-items-center rounded-control text-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => setView(current => moveMonth(current, -1))}>
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <select
              aria-label="Mes del calendario"
              className="h-10 min-w-0 rounded-control border border-transparent bg-surface-muted px-2 text-sm font-bold text-foreground-institutional outline-none transition-colors hover:bg-primary/10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={view.month}
              onChange={event => setView(current => ({ ...current, month: Number(event.target.value) }))}
            >
              {monthNames.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
            </select>
            <select
              aria-label="Año del calendario"
              className="h-10 min-w-0 rounded-control border border-transparent bg-surface-muted px-2 text-sm font-semibold text-foreground-secondary outline-none transition-colors hover:bg-primary/10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={view.year}
              onChange={event => setView(current => ({ ...current, year: Number(event.target.value) }))}
            >
              {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <button type="button" aria-label="Mes siguiente" className="grid size-10 place-items-center rounded-control text-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => setView(current => moveMonth(current, 1))}>
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-semibold text-muted-foreground" aria-hidden="true">
            {weekDays.map(day => <span key={day} className="grid size-9 place-items-center md:size-10">{day}</span>)}
          </div>
          <div role="grid" aria-label={`${monthNames[view.month - 1]} ${view.year}`}>
            {Array.from({ length: days.length / 7 }, (_, weekIndex) => (
              <div key={`week-${weekIndex}`} role="row" className="grid grid-cols-7 gap-y-1">
                {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
                  const cellKey = `cell-${weekIndex}-${dayIndex}`
                  if (!date) return <span key={cellKey} role="gridcell" aria-hidden="true" className="size-9 md:size-10" />
                  const isoValue = toIsoDate(date)
                  const isDisabled = !isWithinLimits(isoValue, min, max)
                  const isSelected = isSameDate(selectedDate, date)
                  const isToday = isSameDate(currentDate, date)
                  return (
                    <span key={isoValue} role="gridcell" aria-selected={isSelected} className="grid size-9 place-items-center md:size-10">
                      <button
                        type="button"
                        aria-label={`Seleccionar ${toDisplayDate(date)}`}
                        aria-pressed={isSelected}
                        disabled={isDisabled}
                        className={`relative grid size-9 !border-0 place-items-center rounded-control text-sm font-medium transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:size-10 ${isSelected ? 'bg-interaction-primary-default text-primary-foreground hover:bg-interaction-primary-hover active:bg-interaction-primary-active' : isToday ? 'text-primary hover:bg-primary/10 active:bg-primary/15 after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-primary' : 'text-foreground hover:bg-primary/10 hover:text-primary active:bg-primary/15'} disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-45 disabled:hover:bg-transparent`}
                        onClick={() => selectDate(date)}
                      >
                        {date.day}
                      </button>
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function DateRangePicker({ startId, endId, startValue, endValue, onStartChange, onEndChange, startLabel = 'Desde', endLabel = 'Hasta', min, max, disabled = false }: DateRangePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const calendarId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState(() => getInitialView(startValue || endValue, min, max))
  const start = parseIsoDate(startValue)
  const end = parseIsoDate(endValue)
  const days = rangeCalendarDays(view)
  const monthLabel = `${monthNames[view.month - 1]} ${view.year}`
  const summary = start && end ? `${toDisplayDate(start)} — ${toDisplayDate(end)}` : start ? `${toDisplayDate(start)} — Seleccione fin` : 'Seleccione un período'

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false) }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); setIsOpen(false) } }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => { document.removeEventListener('mousedown', closeOnOutsideClick); document.removeEventListener('keydown', closeOnEscape) }
  }, [isOpen])

  const selectDate = (date: CalendarDate) => {
    const value = toIsoDate(date)
    if (!isWithinLimits(value, min, max)) return
    if (!start || end || value < startValue) { onStartChange(value); onEndChange(''); return }
    if (value === startValue) { onEndChange(value); setIsOpen(false); return }
    onEndChange(value)
    setIsOpen(false)
  }

  return <div ref={rootRef} className="relative grid gap-2">
    <div className="grid gap-1"><span className="text-label font-semibold text-text-primary">{startLabel} y {endLabel}</span><button id={startId} type="button" disabled={disabled} aria-label={`${startLabel} y ${endLabel}: ${summary}`} aria-haspopup="dialog" aria-expanded={isOpen} aria-controls={isOpen ? calendarId : undefined} onClick={() => { setView(getInitialView(startValue || endValue, min, max)); setIsOpen(true) }} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-control border border-border-default bg-control px-3 text-left text-base font-normal text-text-primary shadow-sm transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"><span className={start ? 'font-medium' : 'text-text-muted'}>{summary}</span><CalendarDays className="size-5 shrink-0 text-primary" aria-hidden="true" /></button><span className="text-caption text-text-secondary">Elija inicio y final en un mismo calendario.</span></div>
    <input id={endId} type="hidden" value={endValue} readOnly aria-label={endLabel} />
    {isOpen ? <div id={calendarId} role="dialog" aria-label="Seleccionar rango de fechas" className="absolute top-full z-40 mt-1 w-full min-w-[min(22rem,calc(100vw-1.5rem))] rounded-surface border border-border-default bg-surface p-3 shadow-lg sm:w-[28rem]"><div className="mb-3 flex items-center justify-between gap-2"><button type="button" aria-label="Mes anterior" className="grid size-10 place-items-center rounded-control hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => setView(current => moveMonth(current, -1))}><ChevronLeft className="size-4" aria-hidden="true" /></button><div className="grid grid-cols-2 gap-1"><select aria-label="Mes del rango" className="h-10 rounded-control border border-border-default bg-surface px-2 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50" value={view.month} onChange={event => setView(current => ({ ...current, month: Number(event.target.value) }))}>{monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select><select aria-label="Año del rango" className="h-10 rounded-control border border-border-default bg-surface px-2 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50" value={view.year} onChange={event => setView(current => ({ ...current, year: Number(event.target.value) }))}>{getAvailableYears(min, max, start ?? end).map(year => <option key={year} value={year}>{year}</option>)}</select></div><button type="button" aria-label="Mes siguiente" className="grid size-10 place-items-center rounded-control hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => setView(current => moveMonth(current, 1))}><ChevronRight className="size-4" aria-hidden="true" /></button></div><div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground" aria-hidden="true">{weekDays.map(day => <span key={day} className="grid size-10 place-items-center">{day}</span>)}</div><div className="grid grid-cols-7" role="grid" aria-label={monthLabel}>{days.map((date, index) => { if (!date) return <span key={`empty-${index}`} className="size-10" aria-hidden="true" />; const value = toIsoDate(date); const unavailable = !isWithinLimits(value, min, max); const selected = value === startValue || value === endValue; const inRange = Boolean(startValue && endValue && value > startValue && value < endValue); return <button key={value} type="button" role="gridcell" disabled={unavailable} aria-label={`Seleccionar ${toDisplayDate(date)}`} aria-pressed={selected} onClick={() => selectDate(date)} className={`relative grid size-10 place-items-center text-sm font-medium transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${selected ? 'rounded-control bg-primary text-primary-foreground' : inRange ? 'bg-primary/15 text-primary' : 'rounded-control hover:bg-muted'} disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-45`}>{date.day}</button> })}</div><div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3"><p className="text-caption text-text-secondary">{start && !end ? 'Ahora seleccione fecha final.' : 'Rango de fechas'}</p><button type="button" className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => { onStartChange(''); onEndChange('') }}>Limpiar</button></div></div> : null}
  </div>
}

function rangeCalendarDays(view: Pick<CalendarDate, 'year' | 'month'>): Array<CalendarDate | null> {
  const firstDayOffset = (new Date(view.year, view.month - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(view.year, view.month, 0).getDate()
  return Array.from({ length: firstDayOffset + daysInMonth }, (_, index) => index < firstDayOffset ? null : { year: view.year, month: view.month, day: index - firstDayOffset + 1 })
}

export type { DatePickerProps, DateRangePickerProps }
