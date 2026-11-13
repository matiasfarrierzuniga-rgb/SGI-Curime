import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  MapPin,
  UsersRound,
} from "lucide-react";
import type { Assembly } from "@/features/assemblies";
import type { PublicEvent } from "@/features/events";
import type { AdminReservation } from "@/features/reservations";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/skeleton";
import { calendarKey, calendarMonthDays, formatCalendarDate } from "@/shared/lib/calendar";
import { calendarActivities, formatCalendarDay, groupActivitiesByDay } from "../../model/calendar";
import type { CalendarActivity, CalendarCategory } from "../../model/calendar";
import { InlineRetry } from "../primitives";
export function InstitutionalCalendar({
  month,
  onMonthChange,
  events,
  reservations,
  assemblies,
  includeReservations,
  includeAssemblies,
  agendaPath,
  sources,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  events?: PublicEvent[];
  reservations?: AdminReservation[];
  assemblies?: Assembly[];
  includeReservations: boolean;
  includeAssemblies: boolean;
  agendaPath: string;
  sources: CalendarSources;
}) {
  const activities = useMemo(
    () =>
      calendarActivities(
        events,
        reservations,
        assemblies,
        includeReservations,
        includeAssemblies,
      ),
    [assemblies, events, includeAssemblies, includeReservations, reservations],
  );
  const activitiesByDay = useMemo(
    () => groupActivitiesByDay(activities, month),
    [activities, month],
  );
  const calendar = calendarMonthDays(month);
  const monthLabel = formatCalendarDate(month, {
    month: "long",
    year: "numeric",
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const enabledSources = Object.values(sources).filter(
    (source) => source.enabled,
  );
  const failedSources = calendarSourceKeys.filter(
    (source) => sources[source].enabled && sources[source].isError,
  );
  const allEnabledSourcesFailed =
    enabledSources.length > 0 && failedSources.length === enabledSources.length;
  const isInitialLoad =
    enabledSources.length > 0 && enabledSources.every((source) => source.isPending);

  return (
    <section aria-label="Calendario institucional">
      <Card className="h-full gap-0 overflow-hidden rounded-surface border-0 bg-surface-card py-0 shadow-elevation-0">
        <CardHeader className="flex min-h-[75px] flex-row items-center gap-2.5 bg-erp-navigation px-5 py-4">
          <CalendarDays
            className="size-6 shrink-0 text-erp-accent"
            aria-hidden="true"
          />
          <h2 className="font-sans text-body font-bold text-erp-navigation-foreground">
            Calendario institucional
          </h2>
        </CardHeader>
        <CardContent className="p-4 pt-5">
          <div className="grid grid-cols-[2.125rem_minmax(0,1fr)_2.125rem] items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-[2.125rem] rounded-control bg-status-success-surface text-erp-navigation hover:bg-status-success-border"
              aria-label="Mes anterior"
              onClick={() =>
                onMonthChange(
                  new Date(month.getFullYear(), month.getMonth() - 1, 1),
                )
              }
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <p className="min-w-0 whitespace-nowrap rounded-full border border-erp-accent bg-surface-card px-1 py-2 text-center text-label font-bold capitalize leading-none text-erp-navigation">
              {monthLabel}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-[2.125rem] rounded-control bg-status-success-surface text-erp-navigation hover:bg-status-success-border"
              aria-label="Mes siguiente"
              onClick={() =>
                onMonthChange(
                  new Date(month.getFullYear(), month.getMonth() + 1, 1),
                )
              }
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
          {isInitialLoad ? (
            <Skeleton className="mt-5 h-60" />
          ) : allEnabledSourcesFailed ? (
            <InlineRetry
              message="No fue posible cargar actividades institucionales."
              onRetry={() => {
                failedSources.forEach((source) => sources[source].onRetry());
              }}
            />
          ) : (
            <>
              {failedSources.length ? (
                <CalendarSourceWarnings
                  sources={failedSources}
                  onRetry={(source) => sources[source].onRetry()}
                />
              ) : null}
              <div
                className="mt-4 grid grid-cols-7 border-b border-erp-accent pb-2.5 text-center text-caption font-bold text-erp-navigation"
                aria-hidden="true"
              >
                {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div
                className="mt-2.5 grid grid-cols-7 gap-y-1.5"
                role="grid"
                aria-label="Días del mes"
              >
                {calendar.map((day) => (
                  <CalendarDay
                    key={day.key}
                    day={day}
                    activities={activitiesByDay.get(day.key) ?? []}
                    onSelect={setSelectedDay}
                  />
                ))}
              </div>
              <CalendarLegend
                includeReservations={includeReservations}
                includeAssemblies={includeAssemblies}
              />
              {!activitiesByDay.size ? (
                <p className="mt-3 text-center text-caption text-erp-text-muted" role="status">
                  No hay actividades institucionales para este mes.
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
      <DashboardCalendarDialog
        key={selectedDay ?? "closed"}
        day={selectedDay}
        activities={activities}
        agendaPath={agendaPath}
        onClose={() => setSelectedDay(null)}
        onSelectDay={setSelectedDay}
      />
    </section>
  );
}

type CalendarSource = {
  enabled: boolean;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
};

type CalendarSources = Record<CalendarCategory, CalendarSource>;

const calendarSourceKeys = ["events", "reservations", "assemblies"] as const;

function CalendarSourceWarnings({
  sources,
  onRetry,
}: {
  sources: readonly CalendarCategory[];
  onRetry: (source: CalendarCategory) => void;
}) {
  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-control border border-status-warning-border bg-status-warning-surface px-3 py-2 text-caption text-status-warning"
      role="status"
    >
      <span>
        No se pudieron cargar: {sources.map((source) => calendarCategoryStyles[source].label.toLocaleLowerCase("es")).join(", ") }.
      </span>
      {sources.map((source) => (
        <Button
          key={source}
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-7 px-1.5 text-caption font-bold text-status-warning underline-offset-2 hover:underline"
          onClick={() => onRetry(source)}
        >
          Reintentar {calendarCategoryStyles[source].label.toLocaleLowerCase("es")}
        </Button>
      ))}
    </div>
  );
}

function CalendarDay({
  day,
  activities,
  onSelect,
}: {
  day: { date: Date; key: string; current: boolean };
  activities: readonly CalendarActivity[];
  onSelect: (day: string) => void;
}) {
  const categories = (["reservations", "assemblies", "events"] as const).filter(
    (category) => activities.some((activity) => activity.category === category),
  );
  const activityLabel = activities.length
    ? `, ${activities.length} ${activities.length === 1 ? "actividad" : "actividades"}: ${categories.map((category) => calendarCategoryStyles[category].label).join(", ")}`
    : "";
  return (
    <button
      type="button"
      role="gridcell"
      aria-label={`${formatCalendarDay(day.key)}${activityLabel}. Abrir agenda de esta fecha.`}
      onClick={() => onSelect(day.key)}
      className={`relative mx-auto size-[2.125rem] rounded-full border text-body-small leading-none transition-transform hover:scale-105 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus ${activities.length ? "border-erp-navigation bg-erp-navigation font-bold text-erp-navigation-foreground" : day.current ? "border-erp-border bg-surface-card text-erp-navigation" : "border-transparent bg-status-success-surface text-erp-text-muted"}`}
    >
      <span className="absolute inset-0 grid place-items-center">
        {day.date.getDate()}
      </span>
      {categories.length ? (
        <span
          aria-hidden="true"
          className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5"
        >
          {categories.map((category) => (
            <span
              key={category}
              className={`size-1.5 rounded-[3px] ${calendarCategoryStyles[category].dot}`}
            />
          ))}
        </span>
      ) : null}
    </button>
  );
}

function CalendarLegend({
  includeReservations,
  includeAssemblies,
}: {
  includeReservations: boolean;
  includeAssemblies: boolean;
}) {
  return (
    <div className="mt-4 flex flex-wrap justify-between gap-x-2 gap-y-2 border-t border-erp-accent pt-3 text-caption text-erp-navigation">
      <CalendarLegendItem
        category="reservations"
        unavailable={!includeReservations}
      />
      <CalendarLegendItem
        category="assemblies"
        unavailable={!includeAssemblies}
      />
      <CalendarLegendItem category="events" />
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-status-info" aria-hidden="true" />
        Otros <span className="sr-only">: sin fuente autorizada</span>
      </span>
    </div>
  );
}

function CalendarLegendItem({
  category,
  unavailable = false,
}: {
  category: CalendarCategory;
  unavailable?: boolean;
}) {
  const style = calendarCategoryStyles[category];
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
      {unavailable ? <span className="sr-only">: sin acceso</span> : null}
    </span>
  );
}

const calendarCategoryStyles: Record<
  CalendarCategory,
  { label: string; dot: string; surface: string }
> = {
  reservations: {
    label: "Reservas",
    dot: "bg-status-info",
    surface: "bg-status-info-surface text-status-info",
  },
  assemblies: {
    label: "Asambleas",
    dot: "bg-status-success",
    surface: "bg-status-success-surface text-status-success",
  },
  events: {
    label: "Eventos",
    dot: "bg-erp-accent",
    surface: "bg-status-warning-surface text-status-warning",
  },
};

function DashboardCalendarDialog({
  day,
  activities,
  agendaPath,
  onClose,
  onSelectDay,
}: {
  day: string | null;
  activities: readonly CalendarActivity[];
  agendaPath: string;
  onClose: () => void;
  onSelectDay: (day: string) => void;
}) {
  const selectedActivities = activities
    .filter((activity) => calendarKey(activity.startAt) === day)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const categorySet = new Set(
    selectedActivities.map((activity) => activity.category),
  );
  const changeDay = (offset: number) => {
    if (!day) return;
    const current = new Date(`${day}T12:00:00-06:00`);
    current.setDate(current.getDate() + offset);
    onSelectDay(calendarKey(current));
  };
  return (
    <Dialog
      open={Boolean(day)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        size="lg"
        overlayClassName="bg-surface-overlay"
        className="max-w-5xl gap-5 border-erp-border-strong/70 bg-erp-surface-raised p-5 sm:p-7"
      >
        <DialogHeader className="pr-9">
          <DialogTitle className="text-heading-2 text-erp-navigation">
            Agenda institucional
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-erp-surface-subtle text-erp-navigation">
              <CalendarDays className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <DialogDescription className="font-heading text-heading-3 font-bold capitalize text-erp-text">
                {day ? formatCalendarDay(day) : "Calendario institucional"}
              </DialogDescription>
              <p className="mt-1 text-body-small text-erp-text-muted">
                Actividades comunitarias programadas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Día anterior"
              onClick={() => changeDay(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Día siguiente"
              onClick={() => changeDay(1)}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div
          className="flex flex-wrap gap-2"
          aria-label="Categorías presentes en la agenda"
        >
          {(["events", "assemblies", "reservations"] as const).map(
            (category) => (
              <span
                key={category}
                className={`inline-flex items-center gap-1.5 rounded-full bg-erp-surface-subtle px-3 py-1 text-caption font-bold ${categorySet.has(category) ? "text-erp-text" : "text-erp-text-muted"}`}
              >
                <span
                  className={`size-2 rounded-sm ${calendarCategoryStyles[category].dot}`}
                  aria-hidden="true"
                />
                {calendarCategoryStyles[category].label}
              </span>
            ),
          )}
        </div>
        <section aria-label="Actividades del día">
          {selectedActivities.length ? (
            <ol className="grid gap-2.5">
              {selectedActivities.map((activity) => (
                <AgendaActivity
                  key={`${activity.category}-${activity.startAt}-${activity.title}`}
                  activity={activity}
                />
              ))}
            </ol>
          ) : (
            <EmptyState
              className="border border-dashed border-erp-border py-8"
              title="Sin actividades para esta fecha"
              description="Seleccione otro día para consultar la agenda institucional."
            />
          )}
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-erp-border pt-4">
          <p className="text-body-small font-bold text-erp-text tabular-nums">
            {selectedActivities.length}{" "}
            {selectedActivities.length === 1
              ? "actividad en este día"
              : "actividades en este día"}
          </p>
          <Link
            to={agendaPath}
            className="inline-flex min-h-10 items-center gap-2 rounded-control bg-erp-navigation px-4 text-body-small font-bold text-erp-navigation-foreground transition-colors hover:bg-erp-navigation/90 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus"
          >
            Ver agenda completa{" "}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AgendaActivity({ activity }: { activity: CalendarActivity }) {
  const category = calendarCategoryStyles[activity.category];
  const IconComponent =
    activity.category === "assemblies"
      ? UsersRound
      : activity.category === "reservations"
        ? CalendarCheck
        : CircleDot;
  return (
    <li className="relative overflow-hidden rounded-control border border-erp-border bg-erp-surface-raised p-4 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-erp-navigation">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="grid size-10 shrink-0 place-items-center rounded-control bg-erp-surface-subtle text-erp-navigation">
          <IconComponent className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-small font-bold text-erp-text">
            {activity.title}
          </p>
          <p className="mt-1 text-caption text-erp-text-muted">
            {category.label} institucional programado.
          </p>
        </div>
        <div className="grid gap-1.5 text-caption text-erp-text-muted sm:w-56">
          <time
            className="flex items-center gap-2 font-medium text-erp-text"
            dateTime={activity.startAt}
          >
            <Clock3
              className="size-3.5 shrink-0 text-erp-navigation"
              aria-hidden="true"
            />
            {formatCalendarDate(activity.startAt, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
          <p className="flex items-center gap-2 truncate">
            <MapPin
              className="size-3.5 shrink-0 text-erp-navigation"
              aria-hidden="true"
            />
            {activity.detail}
          </p>
        </div>
        <Link
          className="shrink-0 text-caption font-bold text-erp-navigation underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
          to={activity.path}
        >
          Ver detalle
        </Link>
      </div>
    </li>
  );
}
