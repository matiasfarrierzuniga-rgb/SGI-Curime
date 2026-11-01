import FullCalendar, { type CalendarRef } from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import listPlugin from '@fullcalendar/react/list'
import esLocale from '@fullcalendar/react/locales/es'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import '@fullcalendar/react/skeleton.css'
import monarchTheme from '@fullcalendar/react/themes/monarch'
import '@fullcalendar/react/themes/monarch/theme.css'
import '@fullcalendar/react/themes/monarch/palettes/green.css'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { calendarKey, formatCalendarDate } from '@/shared/lib/calendar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import type { AdminEvent } from '../model/events.types'
import './institutionalAgenda.css'

export function InstitutionalAgenda({ events }: { events: AdminEvent[] }) {
  const [selected, setSelected] = useState<AdminEvent | null>(null)
  const [selectedDay, setSelectedDay] = useState(() => calendarKey(new Date()))
  const [calendarTitle, setCalendarTitle] = useState('')
  const [calendarView, setCalendarView] = useState<CalendarView>('dayGridMonth')
  const calendarRef = useRef<CalendarRef>(null)
  const scheduled = useMemo(() => events.filter(event => event.status === 'SCHEDULED' && event.publicationStatus !== 'ARCHIVED'), [events])
  const calendarEvents = useMemo(() => scheduled.map(event => ({ id: String(event.id), title: event.title, start: event.startAt, end: event.endAt ?? undefined, extendedProps: { event } })), [scheduled])
  const selectedEvents = useMemo(() => scheduled.filter(event => calendarKey(event.startAt) === selectedDay).sort((a, b) => a.startAt.localeCompare(b.startAt)), [scheduled, selectedDay])
  const selectedLabel = formatCalendarDate(`${selectedDay}T12:00:00-06:00`, { dateStyle: 'full' })

  const navigate = (action: 'prev' | 'next' | 'today') => calendarRef.current?.getApi()[action]()
  const changeView = (view: CalendarView) => { calendarRef.current?.getApi().changeView(view); setCalendarView(view) }

  const nearbyEvents = scheduled.filter(event => calendarKey(event.startAt) > selectedDay).sort((a, b) => a.startAt.localeCompare(b.startAt)).slice(0, 3)
  return <Card className="institutional-agenda min-w-0 overflow-hidden border-border-default bg-surface-card shadow-sm"><CardHeader className="border-b border-border-subtle bg-brand-ivory/60"><CardTitle><span className="flex items-center gap-2"><CalendarDays className="size-5 text-primary" aria-hidden="true" />Agenda institucional</span></CardTitle><CardDescription>Seleccione una fecha para consultar la actividad programada y abra un evento para ver su detalle.</CardDescription></CardHeader><CardContent className="min-w-0 p-3 sm:p-5">{scheduled.length === 0 ? <EmptyState className="py-10" title="No hay eventos programados" description="Los eventos programados aparecerán en esta agenda." /> : <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]"><div className="min-w-0 overflow-hidden rounded-surface border border-border-subtle bg-surface"><CalendarToolbar title={calendarTitle} view={calendarView} onNavigate={navigate} onViewChange={changeView} /><div className="calendar-canvas min-w-0"><FullCalendar ref={calendarRef} plugins={[monarchTheme, dayGridPlugin, timeGridPlugin, listPlugin]} locales={[esLocale]} locale="es" timeZone="America/Costa_Rica" initialView="dayGridMonth" headerToolbar={false} events={calendarEvents} datesSet={info => { setCalendarTitle(info.view.title); setCalendarView(info.view.type as CalendarView) }} dateClick={info => setSelectedDay(info.dateStr)} dayCellClassNames={info => calendarKey(info.date) === selectedDay ? 'fc-sgi-selected-day' : ''} eventClick={info => { info.jsEvent.preventDefault(); const event = info.event.extendedProps.event as AdminEvent; setSelectedDay(calendarKey(event.startAt)); setSelected(event) }} eventTimeFormat={{ hour: 'numeric', minute: '2-digit', hour12: true }} height="auto" dayMaxEventRows={3} moreLinkText={count => `+${count} más`} noEventsContent="No hay eventos en este período." /></div></div><SelectedDayPanel label={selectedLabel} events={selectedEvents} nearbyEvents={nearbyEvents} onOpen={setSelected} /></div>}</CardContent><EventDetailsDialog event={selected} onClose={() => setSelected(null)} /></Card>
}

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'

function CalendarToolbar({ title, view, onNavigate, onViewChange }: { title: string; view: CalendarView; onNavigate: (action: 'prev' | 'next' | 'today') => void; onViewChange: (view: CalendarView) => void }) {
  const views: readonly { value: CalendarView; label: string }[] = [{ value: 'dayGridMonth', label: 'Mes' }, { value: 'timeGridWeek', label: 'Semana' }, { value: 'timeGridDay', label: 'Día' }, { value: 'listWeek', label: 'Agenda' }]
  return <div className="calendar-toolbar"><div className="calendar-view-switcher" role="group" aria-label="Vista del calendario">{views.map(option => <Button key={option.value} type="button" variant={view === option.value ? 'primary' : 'ghost'} size="sm" aria-pressed={view === option.value} onClick={() => onViewChange(option.value)}>{option.label}</Button>)}</div><div className="calendar-period-controls"><h3 className="calendar-toolbar-title">{title}</h3><div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon-sm" aria-label="Período anterior" onClick={() => onNavigate('prev')}><ChevronLeft aria-hidden="true" /></Button><Button type="button" variant="ghost" size="icon-sm" aria-label="Período siguiente" onClick={() => onNavigate('next')}><ChevronRight aria-hidden="true" /></Button><Button type="button" variant="outline" size="sm" onClick={() => onNavigate('today')}>Hoy</Button></div></div></div>
}

function SelectedDayPanel({ label, events, nearbyEvents, onOpen }: { label: string; events: readonly AdminEvent[]; nearbyEvents: readonly AdminEvent[]; onOpen: (event: AdminEvent) => void }) {
  return <aside className="min-w-0 rounded-surface border border-border-default bg-brand-ivory/45 p-4 lg:sticky lg:top-4 lg:self-start"><p className="text-caption font-bold uppercase tracking-wide text-primary">Fecha seleccionada</p><h3 className="mt-1 text-heading-3 font-bold capitalize text-brand-ink">{label}</h3><p className="mt-1 text-caption text-text-secondary">{events.length ? `${events.length} ${events.length === 1 ? 'actividad programada' : 'actividades programadas'}` : 'Sin actividades programadas'}</p>{events.length ? <ol className="mt-4 space-y-2">{events.map(event => <li key={event.id}><button type="button" onClick={() => onOpen(event)} className="w-full rounded-control border border-border-default bg-surface-card p-3 text-left transition hover:border-primary/50 hover:bg-surface focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><div className="flex items-start justify-between gap-2"><p className="truncate text-body-small font-bold text-text-primary">{event.title}</p><StatusBadge variant="info">Programado</StatusBadge></div><p className="mt-2 flex items-center gap-1.5 text-caption text-text-secondary"><Clock3 className="size-3.5 text-primary" aria-hidden="true" />{formatCalendarDate(event.startAt, { timeStyle: 'short' })}</p><p className="mt-1 flex items-center gap-1.5 truncate text-caption text-text-secondary"><MapPin className="size-3.5 text-primary" aria-hidden="true" />{event.location ?? 'Sin lugar indicado'}</p><span className="mt-3 inline-flex text-caption font-bold text-primary">Ver detalle</span></button></li>)}</ol> : <p className="mt-4 rounded-control border border-dashed border-border-default bg-surface/70 px-3 py-4 text-body-small text-text-secondary">No hay actividad institucional registrada para esta fecha.</p>}{nearbyEvents.length ? <section className="mt-5 border-t border-border-subtle pt-4" aria-labelledby="nearby-activities-title"><h4 id="nearby-activities-title" className="text-caption font-bold uppercase tracking-wide text-text-secondary">Actividades cercanas</h4><ol className="mt-2 space-y-2">{nearbyEvents.map(event => <li key={event.id}><button type="button" onClick={() => onOpen(event)} className="w-full text-left text-body-small font-semibold text-text-primary hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><span className="block truncate">{event.title}</span><span className="mt-0.5 block text-caption font-normal text-text-secondary">{formatCalendarDate(event.startAt, { dateStyle: 'medium', timeStyle: 'short' })}</span></button></li>)}</ol></section> : null}</aside>
}

function EventDetailsDialog({ event, onClose }: { event: AdminEvent | null; onClose: () => void }) {
  return <Dialog open={Boolean(event)} onOpenChange={open => { if (!open) onClose() }}><DialogContent size="md"><DialogHeader><DialogTitle>{event?.title ?? 'Detalle de evento'}</DialogTitle><DialogDescription>Información de consulta del registro institucional programado.</DialogDescription></DialogHeader>{event ? <dl className="grid gap-4 text-body-small sm:grid-cols-2"><Detail label="Inicio" value={formatEventDate(event.startAt)} /><Detail label="Finalización" value={event.endAt ? formatEventDate(event.endAt) : 'No indicada'} /><div className="sm:col-span-2"><dt className="font-semibold text-text-secondary">Lugar</dt><dd className="mt-1 flex items-center gap-2 text-text-primary"><MapPin className="size-4 text-primary" aria-hidden="true" />{event.location ?? 'Sin lugar indicado'}</dd></div><div className="sm:col-span-2"><dt className="font-semibold text-text-secondary">Resumen</dt><dd className="mt-1 whitespace-pre-wrap text-text-primary">{event.summary}</dd></div></dl> : null}</DialogContent></Dialog>
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="font-semibold text-text-secondary">{label}</dt><dd className="mt-1 text-text-primary">{value}</dd></div> }
function formatEventDate(value: string) { return new Intl.DateTimeFormat('es-CR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Costa_Rica' }).format(new Date(value)) }
