import { CalendarDays, ChevronLeft, ChevronRight, List, Rows3, Table2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AdminEvent } from '../model/events.types'
import { calendarKey, calendarMonthDays, currentCostaRicaMonth, formatCalendarDate, moveCalendarMonth } from '@/shared/lib/calendar'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/EmptyState'

type AgendaView = 'month' | 'week' | 'day' | 'list'

const viewOptions: { value: AgendaView; label: string; icon: typeof CalendarDays }[] = [
  { value: 'month', label: 'Mes', icon: CalendarDays },
  { value: 'week', label: 'Semana', icon: Rows3 },
  { value: 'day', label: 'Día', icon: Table2 },
  { value: 'list', label: 'Lista', icon: List },
]

export function InstitutionalAgenda({ events }: { events: AdminEvent[] }) {
  const [view, setView] = useState<AgendaView>('month')
  const [month, setMonth] = useState(currentCostaRicaMonth)
  const [selectedDay, setSelectedDay] = useState(() => calendarKey(new Date()))
  const scheduled = useMemo(() => events.filter(event => event.status === 'SCHEDULED' && event.publicationStatus !== 'ARCHIVED'), [events])
  const byDay = useMemo(() => scheduled.reduce((grouped, event) => { const key = calendarKey(event.startAt); grouped.set(key, [...(grouped.get(key) ?? []), event]); return grouped }, new Map<string, AdminEvent[]>()), [scheduled])
  const monthLabel = new Intl.DateTimeFormat('es-CR', { month: 'long', year: 'numeric' }).format(month)
  const selected = byDay.get(selectedDay) ?? []
  const shiftMonth = (offset: number) => setMonth(current => moveCalendarMonth(current, offset))

  return <Card className="min-w-0"><CardHeader className="border-b border-border-default bg-brand-primary/[0.04]"><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle><span className="flex items-center gap-2"><CalendarDays className="size-5 text-brand-primary" aria-hidden="true" />Agenda institucional</span></CardTitle><CardDescription>Eventos programados cargados desde la gestión institucional.</CardDescription></div><div className="flex flex-wrap gap-1" role="group" aria-label="Vista de agenda">{viewOptions.map(option => { const Icon = option.icon; return <Button key={option.value} type="button" variant={view === option.value ? 'secondary' : 'ghost'} size="sm" aria-pressed={view === option.value} onClick={() => setView(option.value)}><Icon aria-hidden="true" />{option.label}</Button> })}</div></div></CardHeader><CardContent className="min-w-0 pt-4"><div className="mb-4 flex items-center justify-between"><Button type="button" variant="ghost" size="icon-sm" aria-label="Mes anterior" onClick={() => shiftMonth(-1)}><ChevronLeft aria-hidden="true" /></Button><p className="capitalize text-sm font-bold text-text-primary">{monthLabel}</p><Button type="button" variant="ghost" size="icon-sm" aria-label="Mes siguiente" onClick={() => shiftMonth(1)}><ChevronRight aria-hidden="true" /></Button></div>{scheduled.length === 0 ? <EmptyState title="No hay eventos programados" description="Los eventos con estado programado aparecerán en esta agenda." /> : view === 'month' ? <MonthGrid month={month} byDay={byDay} selectedDay={selectedDay} onSelect={setSelectedDay} /> : view === 'week' ? <AgendaList events={scheduled.filter(event => isSameWeek(event.startAt, selectedDay))} title="Semana seleccionada" /> : view === 'day' ? <AgendaList events={selected} title={formatCalendarDate(`${selectedDay}T12:00:00-06:00`, { dateStyle: 'full' })} /> : <AgendaList events={scheduled} title="Próximos y registros programados" />}</CardContent></Card>
}

function MonthGrid({ month, byDay, selectedDay, onSelect }: { month: Date; byDay: Map<string, AdminEvent[]>; selectedDay: string; onSelect: (value: string) => void }) {
  return <div className="min-w-0"><div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-muted" aria-hidden="true">{['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(day => <span key={day}>{day}</span>)}</div><div className="mt-2 grid grid-cols-7 gap-1" role="grid" aria-label="Calendario mensual de eventos">{calendarMonthDays(month).map(day => { const items = byDay.get(day.key) ?? []; return <button key={day.key} type="button" role="gridcell" aria-label={`${formatCalendarDate(day.date, { dateStyle: 'full' })}${items.length ? `, ${items.length} eventos` : ', sin eventos'}`} aria-pressed={selectedDay === day.key} onClick={() => onSelect(day.key)} className={`min-h-18 rounded-control border p-1.5 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${day.current ? 'border-border-default bg-surface hover:bg-muted/60' : 'border-transparent bg-muted/30 text-text-muted'} ${selectedDay === day.key ? 'ring-2 ring-brand-primary' : ''}`}><span className="text-xs font-semibold">{day.date.getDate()}</span>{items.slice(0, 2).map(event => <span className="mt-1 block truncate rounded bg-brand-primary/10 px-1 text-[10px] font-semibold text-brand-primary" key={event.id} title={event.title}>{event.title}</span>)}{items.length > 2 ? <span className="mt-0.5 block text-[10px] text-text-secondary">+{items.length - 2} más</span> : null}</button> })}</div></div>
}

function AgendaList({ events, title }: { events: AdminEvent[]; title: string }) {
  return <section aria-label={title}><h3 className="mb-3 text-sm font-semibold text-text-primary">{title}</h3>{events.length === 0 ? <EmptyState className="py-6" title="Sin eventos en esta vista" description="Cambie de fecha o consulte otra vista de la agenda." /> : <ol className="divide-y divide-border-default">{[...events].sort((a, b) => a.startAt.localeCompare(b.startAt)).map(event => <li className="flex gap-3 py-3 first:pt-0" key={event.id}><time className="w-24 shrink-0 text-xs font-semibold text-brand-primary" dateTime={event.startAt}>{formatCalendarDate(event.startAt, { dateStyle: 'short', timeStyle: 'short' })}</time><div className="min-w-0"><p className="font-semibold text-text-primary">{event.title}</p><p className="mt-1 text-sm text-text-secondary">{event.location ?? 'Sin lugar indicado'}{event.endAt ? ` · hasta ${formatCalendarDate(event.endAt, { timeStyle: 'short' })}` : ''}</p></div></li>)}</ol>}</section>
}

function isSameWeek(value: string, selectedDay: string) {
  const selected = new Date(`${selectedDay}T12:00:00-06:00`)
  const monday = new Date(selected); monday.setDate(selected.getDate() - ((selected.getDay() + 6) % 7))
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 7)
  const event = new Date(value)
  return event >= monday && event < sunday
}
