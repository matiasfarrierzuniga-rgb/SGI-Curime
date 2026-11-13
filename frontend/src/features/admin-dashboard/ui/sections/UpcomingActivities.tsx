import { CalendarDays, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { PublicEvent } from "@/features/events";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/skeleton";
import { DashboardCard, InlineRetry } from "../primitives";

export function UpcomingActivities({
  events,
  isPending,
  isError,
  onRetry,
}: {
  events?: PublicEvent[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const upcoming = useMemo(
    () =>
      (Array.isArray(events) ? events : [])
        .filter(
          (event) =>
            event.status === "SCHEDULED" &&
            new Date(event.startAt).getTime() >= startOfToday().getTime(),
        )
        .sort(
          (a, b) =>
            new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
        )
        .slice(0, 4),
    [events],
  );
  return (
    <section aria-labelledby="admin-upcoming-title">
      <DashboardCard title="Próximas actividades" icon={CalendarDays} tone="info">
        {isPending ? (
          <Skeleton className="h-52" />
        ) : isError ? (
          <InlineRetry message="No fue posible cargar actividades." onRetry={onRetry} />
        ) : upcoming.length ? (
          <div className="divide-y divide-erp-border">
            {upcoming.map((event) => <UpcomingEvent key={event.publicId} event={event} />)}
          </div>
        ) : (
          <EmptyState
            className="py-8"
            title="No hay actividades próximas."
            description="Los eventos públicos programados aparecerán aquí."
          />
        )}
      </DashboardCard>
    </section>
  );
}

function UpcomingEvent({ event }: { event: PublicEvent }) {
  const date = new Date(event.startAt);
  return (
    <Link to={`/eventos/${event.publicId}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erp-focus">
      <time dateTime={event.startAt} className="grid size-11 shrink-0 place-items-center rounded-control bg-status-info-surface text-center text-caption font-bold leading-tight text-status-info">
        <span>{new Intl.DateTimeFormat("es-CR", { month: "short", timeZone: "America/Costa_Rica" }).format(date).replace(".", "").toUpperCase()}</span>
        <span className="text-body-small">{new Intl.DateTimeFormat("es-CR", { day: "2-digit", timeZone: "America/Costa_Rica" }).format(date)}</span>
      </time>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-body-small font-bold text-erp-text">{event.title}</h3>
        <p className="mt-0.5 truncate text-caption text-erp-text-muted">{formatEventTime(event.startAt)}{event.location ? ` · ${event.location}` : ""}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-erp-text-muted" aria-hidden="true" />
    </Link>
  );
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("es-CR", { hour: "numeric", minute: "2-digit", timeZone: "America/Costa_Rica" }).format(new Date(value));
}
