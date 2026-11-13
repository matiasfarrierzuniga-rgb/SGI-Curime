import type { Assembly } from "@/features/assemblies";
import type { PublicEvent } from "@/features/events";
import type { AdminReservation } from "@/features/reservations";
import {
  calendarKey,
  civilDateKey,
  formatCalendarDate,
} from "@/shared/lib/calendar";
export type CalendarCategory = "reservations" | "assemblies" | "events";

export type CalendarActivity = {
  id: string;
  category: CalendarCategory;
  startAt: string;
  title: string;
  detail: string;
  path: string;
  sourcePublicId?: string;
  sourceId?: number;
};

export function calendarActivities(
  events: PublicEvent[] | undefined,
  reservations: AdminReservation[] | undefined,
  assemblies: Assembly[] | undefined,
  includeReservations: boolean,
  includeAssemblies: boolean,
): CalendarActivity[] {
  const activities: CalendarActivity[] = (Array.isArray(events) ? events : [])
    .filter((event) => event.status === "SCHEDULED")
    .map<CalendarActivity>((event) => ({
      id: `event-${event.publicId}`,
      category: "events",
      startAt: event.startAt,
      title: event.title,
      detail: event.location ?? "Sin lugar indicado",
      path: `/eventos/${event.publicId}`,
      sourcePublicId: event.publicId,
    }));
  if (includeReservations)
    activities.push(
      ...(Array.isArray(reservations) ? reservations : [])
        .filter(
          (reservation) =>
            reservation.status === "APPROVED" ||
            reservation.status === "CONFIRMED",
        )
        .map<CalendarActivity>((reservation) => ({
          id: `reservation-${reservation.id}`,
          category: "reservations",
          startAt: reservation.startAt,
          title: reservation.resource.name,
          detail: reservation.resource.location ?? "Reserva institucional",
          path: "/app/reservations",
          sourceId: reservation.id,
        })),
    );
  if (includeAssemblies)
    activities.push(
      ...(Array.isArray(assemblies) ? assemblies : [])
        .filter((assembly) => assembly.status !== "CANCELLED")
        .map<CalendarActivity>((assembly) => ({
          id: `assembly-${assembly.id}`,
          category: "assemblies",
          startAt: assembly.date,
          title: assembly.title,
          detail: assembly.place || "Sin lugar indicado",
          path: `/app/admin/assemblies/${assembly.id}`,
          sourceId: assembly.id,
        })),
    );
  return activities;
}

export function groupActivitiesByDay(
  activities: readonly CalendarActivity[],
  month: Date,
) {
  const prefix = civilMonthKey(month);
  return activities.reduce((grouped, activity) => {
    const key = calendarKey(activity.startAt);
    if (key.startsWith(prefix))
      grouped.set(key, [...(grouped.get(key) ?? []), activity]);
    return grouped;
  }, new Map<string, CalendarActivity[]>());
}

export function calendarMonthFilters(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  return {
    from: civilDateKey(year, monthIndex + 1, 1),
    to: civilDateKey(year, monthIndex + 2, 0),
    page: 1,
    limit: 100,
  };
}

export function civilMonthKey(month: Date) {
  return civilDateKey(month.getFullYear(), month.getMonth() + 1, 1).slice(0, 7);
}

export function formatCalendarDay(value: string) {
  return formatCalendarDate(`${value}T12:00:00-06:00`, { dateStyle: "full" });
}
