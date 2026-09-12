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
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

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

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid = false,
}: DatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const calendarId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(() => formatValue(value))
  const [inputInvalid, setInputInvalid] = useState(false)
  const [view, setView] = useState(() => {
    const selected = parseIsoDate(value) ?? today()
    return { year: selected.year, month: selected.month }
  })

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
    if (disabled || isOpen) return
    const selected = parseIsoDate(value) ?? today()
    setView({ year: selected.year, month: selected.month })
    setIsOpen(true)
  }

  const closeCalendar = (restoreFocus = false) => {
    setIsOpen(false)
    if (restoreFocus) requestAnimationFrame(() => inputRef.current?.focus())
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
  const firstDayOffset = (new Date(view.year, view.month - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(view.year, view.month, 0).getDate()
  const days = Array.from({ length: firstDayOffset + daysInMonth }, (_, index) => {
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
        <CalendarDays aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {isOpen ? (
        <div
          id={calendarId}
          role="dialog"
          aria-label="Calendario"
          className="absolute top-full right-0 z-30 mt-2 w-[min(20rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] rounded-surface border border-border-default bg-surface p-3 shadow-lg"
        >
          <div className="mb-3 grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
            <button type="button" aria-label="Mes anterior" className="grid size-10 place-items-center rounded-control text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => setView(current => moveMonth(current, -1))}>
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <p className="text-center text-sm font-semibold text-foreground">{monthNames[view.month - 1]} {view.year}</p>
            <button type="button" aria-label="Mes siguiente" className="grid size-10 place-items-center rounded-control text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => setView(current => moveMonth(current, 1))}>
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-semibold text-muted-foreground" aria-hidden="true">
            {weekDays.map(day => <span key={day} className="grid size-9 place-items-center md:size-10">{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1" role="grid" aria-label={`${monthNames[view.month - 1]} ${view.year}`}>
            {days.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} className="size-9 md:size-10" aria-hidden="true" />
              const isoValue = toIsoDate(date)
              const isDisabled = !isWithinLimits(isoValue, min, max)
              const isSelected = isSameDate(selectedDate, date)
              const isToday = isSameDate(currentDate, date)
              return (
                <button
                  key={isoValue}
                  type="button"
                  aria-label={`Seleccionar ${toDisplayDate(date)}`}
                  aria-pressed={isSelected}
                  disabled={isDisabled}
                  className={`grid size-9 place-items-center rounded-control text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:size-10 ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : isToday ? 'border border-primary text-primary hover:bg-primary/10' : 'text-foreground hover:bg-muted'} disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-45 disabled:hover:bg-transparent`}
                  onClick={() => selectDate(date)}
                >
                  {date.day}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export type { DatePickerProps }
