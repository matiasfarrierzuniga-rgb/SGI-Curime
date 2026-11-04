import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleDot,
  ClipboardList,
  Clock3,
  FileClock,
  FileText,
  Heart,
  MapPin,
  Package,
  PackageX,
  RefreshCw,
  Sun,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { usePublicEvents } from "@/features/events";
import type { PublicEvent } from "@/features/events";
import { useAssemblies } from "@/features/assemblies";
import type { Assembly } from "@/features/assemblies";
import { useReservationsList } from "@/features/reservations";
import type { AdminReservation } from "@/features/reservations";
import { userRequestsService } from "@/features/user-requests";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Skeleton } from "@/shared/ui/skeleton";
import { hasCapability, type AccessCapability } from "@/shared/security/access";
import {
  calendarKey,
  calendarMonthDays,
  civilDateKey,
  currentCostaRicaMonth,
  formatCalendarDate,
} from "@/shared/lib/calendar";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import type { AdminDashboardData } from "../model/adminDashboard.types";

type AdminDashboardProps = {
  permissionCodes?: readonly string[];
  userName?: string;
};
type Icon = typeof Users;
type AccountRequestStatus = {
  isPending: boolean;
  isError: boolean;
  total?: number;
};
type Tone = "success" | "warning" | "danger" | "info" | "violet";
type QuickAction = {
  label: string;
  path: string;
  capability: AccessCapability;
  icon: Icon;
  tone: Tone;
};
type CalendarCategory = "reservations" | "assemblies" | "events";
type CalendarActivity = {
  id: string;
  category: CalendarCategory;
  startAt: string;
  title: string;
  detail: string;
  path: string;
};

const quickActions: readonly QuickAction[] = [
  {
    label: "Gestionar afiliados",
    path: "/app/admin/affiliates",
    capability: "adm.affiliates.read",
    icon: Users,
    tone: "success",
  },
  {
    label: "Gestionar reservas",
    path: "/app/reservations",
    capability: "res.reservations.read",
    icon: CalendarCheck,
    tone: "info",
  },
  {
    label: "Inventario",
    path: "/inventory",
    capability: "inv.inventory.read",
    icon: Package,
    tone: "success",
  },
  {
    label: "Convocar asamblea",
    path: "/app/admin/assemblies",
    capability: "governance.assembly.create",
    icon: UsersRound,
    tone: "warning",
  },
  {
    label: "Registrar donación",
    path: "/app/donations",
    capability: "don.donations.create",
    icon: Heart,
    tone: "violet",
  },
  {
    label: "Ver reportes",
    path: "/inventory/reports",
    capability: "inv.inventory.read",
    icon: FileText,
    tone: "info",
  },
];

export function AdminDashboard({
  permissionCodes,
  userName,
}: AdminDashboardProps) {
  const dashboard = useAdminDashboard();
  const events = usePublicEvents();
  const [calendarMonth, setCalendarMonth] = useState(() =>
    currentCostaRicaMonth(),
  );
  const canReadAccountRequests = hasCapability(
    permissionCodes,
    "usr.user-requests.read",
  );
  const canReadReservations = hasCapability(
    permissionCodes,
    "res.reservations.read",
  );
  const canReadAssemblies =
    hasCapability(permissionCodes, "governance.assembly.session") ||
    hasCapability(permissionCodes, "adm.assemblies.read");
  const reservationCalendar = useReservationsList(
    calendarMonthFilters(calendarMonth),
    canReadReservations,
  );
  const assembliesCalendar = useAssemblies(canReadAssemblies);
  const accountRequests = useQuery({
    queryKey: ["user-requests", "dashboard", "pending"],
    queryFn: () =>
      userRequestsService.list({ page: 1, limit: 1, status: "PENDING" }),
    enabled: canReadAccountRequests,
    staleTime: 30_000,
  });

  if (dashboard.isPending)
    return (
      <section aria-busy="true">
        <InstitutionalWelcome fullName={userName} />
        <DashboardSkeleton />
      </section>
    );
  if (dashboard.isError)
    return (
      <section>
        <InstitutionalWelcome fullName={userName} />
        <ErrorState
          className="mt-5"
          title="No fue posible cargar los indicadores"
          message="Intente nuevamente para consultar el estado administrativo actual."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => void dashboard.refetch()}
            >
              <RefreshCw aria-hidden="true" />
              Reintentar
            </Button>
          }
        />
      </section>
    );

  const { data, metadata } = dashboard.data;
  if (!hasData(data))
    return (
      <section>
        <InstitutionalWelcome
          fullName={userName}
          generatedAt={metadata.generatedAt}
        />
        <EmptyState
          className="mt-5"
          title="No hay indicadores autorizados para esta sesión."
          description="Las métricas aparecen únicamente cuando su capacidad permite consultar el módulo correspondiente."
        />
      </section>
    );

  const accountStatus = {
    isPending: accountRequests.isPending,
    isError: accountRequests.isError,
    total: accountRequests.data?.total,
  };
  return (
    <section className="space-y-4">
      <InstitutionalWelcome
        fullName={userName}
        generatedAt={metadata.generatedAt}
      />
      <KpiRow
        data={data}
        permissionCodes={permissionCodes}
        accountRequests={accountStatus}
        canReadAccountRequests={canReadAccountRequests}
      />
      <div className="grid min-w-0 gap-3 min-[1200px]:grid-cols-[minmax(0,1.32fr)_minmax(0,1fr)] min-[1200px]:items-stretch">
        <AttentionPanel
          data={data}
          permissionCodes={permissionCodes}
          accountRequests={accountStatus}
          canReadAccountRequests={canReadAccountRequests}
        />
        <QuickActions
          actions={quickActions.filter((action) =>
            hasCapability(permissionCodes, action.capability),
          )}
        />
      </div>
      <InstitutionalCalendar
        month={calendarMonth}
        onMonthChange={setCalendarMonth}
        events={events.data}
        reservations={reservationCalendar.data?.data}
        assemblies={assembliesCalendar.data}
        includeReservations={canReadReservations}
        includeAssemblies={canReadAssemblies}
        agendaPath={
          hasCapability(permissionCodes, "events.proposal.create") ||
          hasCapability(permissionCodes, "events.proposal.review") ||
          hasCapability(permissionCodes, "events.proposal.approve") ||
          hasCapability(permissionCodes, "events.publish") ||
          hasCapability(permissionCodes, "pub.events.manage")
            ? "/app/events"
            : "/eventos"
        }
        isPending={
          events.isPending ||
          (canReadReservations && reservationCalendar.isPending) ||
          (canReadAssemblies && assembliesCalendar.isPending)
        }
        isError={
          events.isError ||
          (canReadReservations && reservationCalendar.isError) ||
          (canReadAssemblies && assembliesCalendar.isError)
        }
        onRetry={() => {
          void events.refetch();
          if (canReadReservations) void reservationCalendar.refetch();
          if (canReadAssemblies) void assembliesCalendar.refetch();
        }}
      />
      <div className="grid min-w-0 gap-3 min-[1200px]:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)_minmax(0,1.12fr)] min-[1200px]:items-stretch">
        <ModuleSummary data={data} permissionCodes={permissionCodes} />
        <ProcessStatus />
        <UpcomingActivities
          events={events.data}
          isPending={events.isPending}
          isError={events.isError}
          onRetry={() => void events.refetch()}
        />
      </div>
    </section>
  );
}

function InstitutionalWelcome({
  fullName,
  generatedAt,
}: {
  fullName?: string;
  generatedAt?: string;
}) {
  const firstName = fullName?.trim().split(/\s+/)[0];
  const date = generatedAt ? formatDashboardDate(generatedAt) : null;
  return (
    <header className="relative isolate min-h-42 overflow-hidden border-y border-erp-border bg-erp-surface-subtle xl:-mx-6 xl:-mt-9">
      <img
        src="/images/public/home/hero-curime-wide.webp"
        alt=""
        className="absolute inset-0 -z-20 size-full object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fffdf7] via-[#fffdf7]/90 to-[#fffdf7]/35"
      />
      <div className="grid min-h-42 gap-5 px-5 py-6 sm:px-7 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.62fr)] md:items-center md:px-10 md:py-5">
        <div className="flex min-w-0 gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-status-warning-surface text-erp-accent">
            <Sun className="size-7" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-caption font-bold uppercase tracking-[0.16em] text-erp-accent">
              Administración
            </p>
            <h1
              id="admin-indicators-title"
              className="mt-1 font-sans text-heading-1 font-bold leading-tight tracking-[-0.025em] text-[#073f31]"
            >
              Buenos días{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-1 text-body text-erp-text">
              Aquí tiene el resumen de la gestión de la ADI Curime.
            </p>
            {date ? (
              <p className="mt-3 flex items-center gap-2 text-body-small text-erp-text">
                <CalendarDays
                  className="size-4 shrink-0 text-erp-navigation"
                  aria-hidden="true"
                />
                <time dateTime={generatedAt}>{date}</time>
              </p>
            ) : null}
          </div>
        </div>
        <aside className="rounded-surface border border-white/70 bg-[#fffdf7]/90 px-5 py-4 text-[#073f31] shadow-lg backdrop-blur-sm">
          <p className="font-sans text-heading-3 font-semibold leading-snug tracking-[-0.01em]">
            Una comunidad organizada construye más oportunidades.
          </p>
          <p className="mt-2 text-body-small text-erp-text-muted">ADI Curime</p>
        </aside>
      </div>
    </header>
  );
}

function KpiRow({
  data,
  permissionCodes,
  accountRequests,
  canReadAccountRequests,
}: {
  data: AdminDashboardData;
  permissionCodes?: readonly string[];
  accountRequests: AccountRequestStatus;
  canReadAccountRequests: boolean;
}) {
  const accountValue = !canReadAccountRequests
    ? null
    : accountRequests.isPending
      ? "—"
      : accountRequests.isError
        ? null
        : (accountRequests.total ?? 0);
  const cards = [
    data.affiliates && hasCapability(permissionCodes, "adm.affiliates.read") ? (
      <KpiCard
        key="affiliates"
        title="Afiliados activos"
        subtitle="Registrados en el sistema"
        value={data.affiliates.active}
        icon={Users}
        tone="success"
        action={{ label: "Ver afiliados", path: "/app/admin/affiliates" }}
      />
    ) : null,
    data.reservations &&
    hasCapability(permissionCodes, "res.reservations.read") ? (
      <KpiCard
        key="reservations"
        title="Reservas pendientes"
        subtitle="Por confirmar"
        value={data.reservations.pending}
        icon={CalendarCheck}
        tone="info"
        action={{ label: "Gestionar reservas", path: "/app/reservations" }}
      />
    ) : null,
    data.inventory && hasCapability(permissionCodes, "inv.inventory.read") ? (
      <KpiCard
        key="inventory"
        title="Artículos en inventario"
        subtitle="Registrados en el sistema"
        value={data.inventory.totalItems}
        icon={Package}
        tone="warning"
        action={{ label: "Ver inventario", path: "/inventory" }}
      />
    ) : null,
    canReadAccountRequests ? (
      <KpiCard
        key="account-requests"
        title="Solicitudes pendientes"
        subtitle={
          accountValue === null
            ? "Información no disponible"
            : "Pendientes de revisión"
        }
        value={accountValue}
        icon={UserPlus}
        tone="danger"
        action={
          !accountRequests.isError
            ? { label: "Ver solicitudes", path: "/admin/user-requests" }
            : undefined
        }
      />
    ) : null,
  ].filter((card): card is ReactElement => card !== null);
  if (!cards.length) return null;
  return (
    <section
      aria-labelledby="admin-indicators-title"
      className="grid min-w-0 gap-3 sm:grid-cols-2 min-[1200px]:grid-cols-4"
    >
      {cards}
    </section>
  );
}

function KpiCard({
  title,
  subtitle,
  value,
  icon: IconComponent,
  tone,
  action,
}: {
  title: string;
  subtitle: string;
  value: number | string | null;
  icon: Icon;
  tone: Tone;
  action?: { label: string; path: string };
}) {
  return (
    <article className="flex min-h-34 flex-col rounded-surface border border-erp-border bg-erp-surface-raised p-4 shadow-elevation-0">
      <div className="flex items-start gap-3">
        <IconTile icon={IconComponent} tone={tone} />
        <div className="min-w-0 pt-0.5">
          <h2 className="text-label font-semibold leading-snug text-erp-text">
            {title}
          </h2>
          <p className="mt-0.5 text-caption text-erp-text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-heading-1 leading-none font-bold tabular-nums tracking-[-0.025em] text-erp-text">
          {displayCount(value)}
        </p>
        {action ? (
          <Link
            to={action.path}
            aria-label={action.label}
            className="grid size-8 place-items-center rounded-full text-erp-navigation transition-colors hover:bg-status-success-surface focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-erp-focus"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <p className="mt-auto pt-2 text-caption text-erp-text-muted">
        Actualizado con datos del sistema
      </p>
    </article>
  );
}

type AttentionItem = {
  label: string;
  detail: string;
  count: number;
  icon: Icon;
  tone: Tone;
  path: string;
  capability: AccessCapability;
};
function AttentionPanel({
  data,
  permissionCodes,
  accountRequests,
  canReadAccountRequests,
}: {
  data: AdminDashboardData;
  permissionCodes?: readonly string[];
  accountRequests: AccountRequestStatus;
  canReadAccountRequests: boolean;
}) {
  const items: AttentionItem[] = [];
  if (
    canReadAccountRequests &&
    !accountRequests.isPending &&
    !accountRequests.isError &&
    (accountRequests.total ?? 0) > 0
  )
    items.push({
      label: "Solicitudes de cuenta",
      detail: "Pendientes de revisión",
      count: accountRequests.total ?? 0,
      icon: UserPlus,
      tone: "danger",
      path: "/admin/user-requests",
      capability: "usr.user-requests.read",
    });
  if (
    hasCapability(permissionCodes, "padron.application.review") &&
    data.affiliateRequests &&
    data.affiliateRequests.pending > 0
  )
    items.push({
      label: "Solicitudes de afiliación",
      detail: "Pendientes de revisión",
      count: data.affiliateRequests.pending,
      icon: UsersRound,
      tone: "warning",
      path: "/app/admin/requests",
      capability: "padron.application.review",
    });
  if (
    hasCapability(permissionCodes, "inv.inventory.read") &&
    data.inventory &&
    data.inventory.lowStockItems > 0
  )
    items.push({
      label: "Artículos con stock bajo",
      detail: "Existencias por revisar",
      count: data.inventory.lowStockItems,
      icon: Package,
      tone: "warning",
      path: "/inventory/alerts",
      capability: "inv.inventory.read",
    });
  if (
    hasCapability(permissionCodes, "inv.inventory.read") &&
    data.inventory &&
    data.inventory.overdueLoans > 0
  )
    items.push({
      label: "Préstamos vencidos",
      detail: "Préstamos fuera de plazo",
      count: data.inventory.overdueLoans,
      icon: FileClock,
      tone: "danger",
      path: "/inventory/loans",
      capability: "inv.inventory.read",
    });
  if (
    hasCapability(permissionCodes, "inv.inventory.read") &&
    data.inventory &&
    data.inventory.outOfStockItems > 0
  )
    items.push({
      label: "Artículos agotados",
      detail: "Sin existencias",
      count: data.inventory.outOfStockItems,
      icon: PackageX,
      tone: "danger",
      path: "/inventory/alerts",
      capability: "inv.inventory.read",
    });
  return (
    <section aria-label="Atención requerida">
      <DashboardCard
        title="Atención requerida"
        description="Pendientes y riesgos operativos"
        icon={AlertTriangle}
        tone="danger"
        count={items.reduce((total, item) => total + item.count, 0)}
      >
        {items.length ? (
          <div className="divide-y divide-erp-border">
            {items.map((item) => (
              <AttentionRow key={item.label} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="py-8"
            title="No hay pendientes de atención."
            description="No se registran alertas operativas activas."
          />
        )}
      </DashboardCard>
    </section>
  );
}

function AttentionRow({ item }: { item: AttentionItem }) {
  const IconComponent = item.icon;
  return (
    <Link
      to={item.path}
      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erp-focus"
    >
      <IconTile icon={IconComponent} tone={item.tone} size="sm" />
      <div className="min-w-0 flex-1">
        <h3 className="text-body-small font-bold leading-snug text-erp-text">
          {displayCount(item.count)} {item.label.toLocaleLowerCase("es")}
        </h3>
        <p className="mt-0.5 text-caption text-erp-text-muted">{item.detail}</p>
      </div>
      <ChevronRight
        className="size-4 shrink-0 text-erp-text-muted"
        aria-hidden="true"
      />
    </Link>
  );
}

function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  return (
    <section aria-label="Accesos rápidos">
      <DashboardCard title="Accesos rápidos" icon={ClipboardList} tone="info">
        {actions.length ? (
          <nav
            aria-label="Accesos rápidos administrativos"
            className="grid grid-cols-3 gap-2"
          >
            {actions.map((action) => (
              <QuickAction key={action.path} action={action} />
            ))}
          </nav>
        ) : (
          <EmptyState
            className="py-8"
            title="No hay accesos disponibles."
            description="No cuenta con acciones administrativas autorizadas."
          />
        )}
      </DashboardCard>
    </section>
  );
}
function QuickAction({ action }: { action: QuickAction }) {
  const IconComponent = action.icon;
  return (
    <Link
      to={action.path}
      className="group flex min-h-28 flex-col items-center justify-center gap-2 rounded-control border border-erp-border bg-erp-surface-subtle/70 p-2 text-center transition-colors hover:border-erp-border-strong hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erp-focus"
    >
      <IconTile icon={IconComponent} tone={action.tone} />
      <span className="text-body-small font-semibold leading-snug text-erp-text">
        {action.label}
      </span>
    </Link>
  );
}

function InstitutionalCalendar({
  month,
  onMonthChange,
  events,
  reservations,
  assemblies,
  includeReservations,
  includeAssemblies,
  agendaPath,
  isPending,
  isError,
  onRetry,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  events?: PublicEvent[];
  reservations?: AdminReservation[];
  assemblies?: Assembly[];
  includeReservations: boolean;
  includeAssemblies: boolean;
  agendaPath: string;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
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

  return (
    <section aria-label="Calendario institucional">
      <Card className="h-full gap-0 overflow-hidden rounded-[17px] border-0 bg-[#fffdf7] py-0 shadow-elevation-0">
        <CardHeader className="flex min-h-[75px] flex-row items-center gap-2.5 bg-[#073f30] px-5 py-4">
          <CalendarDays
            className="size-6 shrink-0 text-[#d4a547]"
            aria-hidden="true"
          />
          <h2 className="font-sans text-body font-bold text-white">
            Calendario institucional
          </h2>
        </CardHeader>
        <CardContent className="p-4 pt-5">
          <div className="grid grid-cols-[2.125rem_minmax(0,1fr)_2.125rem] items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-[2.125rem] rounded-[9px] bg-[#e5ece2] text-[#073f30] hover:bg-[#d8e3d7]"
              aria-label="Mes anterior"
              onClick={() =>
                onMonthChange(
                  new Date(month.getFullYear(), month.getMonth() - 1, 1),
                )
              }
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <p className="min-w-0 whitespace-nowrap rounded-full border border-[#d4a547] bg-[#fffdf7] px-1 py-2 text-center text-label font-bold capitalize leading-none text-[#073f30]">
              {monthLabel}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-[2.125rem] rounded-[9px] bg-[#e5ece2] text-[#073f30] hover:bg-[#d8e3d7]"
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
          {isPending ? (
            <Skeleton className="mt-5 h-60" />
          ) : isError ? (
            <InlineRetry
              message="No fue posible cargar actividades institucionales."
              onRetry={onRetry}
            />
          ) : (
            <>
              <div
                className="mt-4 grid grid-cols-7 border-b border-[#d4a547] pb-2.5 text-center text-caption font-bold text-[#073f30]"
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
      className={`relative mx-auto size-[2.125rem] rounded-full border text-body-small leading-none transition-transform hover:scale-105 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erp-focus ${activities.length ? "border-[#073f30] bg-[#073f30] font-bold text-white" : day.current ? "border-[#d8ded1] bg-[#fffdf7] text-[#073f30]" : "border-transparent bg-[#e5ece2] text-[#869485]"}`}
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
    <div className="mt-4 flex flex-wrap justify-between gap-x-2 gap-y-2 border-t border-[#d4a547] pt-3 text-caption text-[#073f30]">
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
        <span className="size-2 rounded-full bg-[#8d56dc]" aria-hidden="true" />
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
    dot: "bg-[#2878f0]",
    surface: "bg-[#e9f2ff] text-[#145ecb]",
  },
  assemblies: {
    label: "Asambleas",
    dot: "bg-[#279b72]",
    surface: "bg-[#e6f6ee] text-[#0c7350]",
  },
  events: {
    label: "Eventos",
    dot: "bg-[#d69b2d]",
    surface: "bg-[#fdf3df] text-[#9b6610]",
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
        overlayClassName="bg-[rgb(17_24_39_/_40%)]"
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
            className="inline-flex min-h-10 items-center gap-2 rounded-control bg-erp-navigation px-4 text-body-small font-bold text-white transition-colors hover:bg-erp-navigation/90 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-erp-focus"
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
          className="shrink-0 text-caption font-bold text-erp-navigation underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erp-focus"
          to={activity.path}
        >
          Ver detalle
        </Link>
      </div>
    </li>
  );
}

function ModuleSummary({
  data,
  permissionCodes,
}: {
  data: AdminDashboardData;
  permissionCodes?: readonly string[];
}) {
  const modules: Array<{
    title: string;
    value: string;
    icon: Icon;
    tone: Tone;
    path: string;
    capability: AccessCapability;
  }> = [];
  if (data.affiliates)
    modules.push({
      title: "Afiliados",
      value: `${displayCount(data.affiliates.active)} activos`,
      icon: Users,
      tone: "success",
      path: "/app/admin/affiliates",
      capability: "adm.affiliates.read",
    });
  if (data.reservations)
    modules.push({
      title: "Reservas",
      value: `${displayCount(data.reservations.total)} total`,
      icon: CalendarCheck,
      tone: "info",
      path: "/app/reservations",
      capability: "res.reservations.read",
    });
  if (data.inventory)
    modules.push({
      title: "Inventario",
      value: `${displayCount(data.inventory.totalItems)} artículos`,
      icon: Package,
      tone: "warning",
      path: "/inventory",
      capability: "inv.inventory.read",
    });
  if (data.assemblies)
    modules.push({
      title: "Asambleas",
      value: `${displayCount(data.assemblies.scheduled)} programadas`,
      icon: UsersRound,
      tone: "success",
      path: "/app/admin/assemblies",
      capability: "governance.assembly.session",
    });
  if (data.donations)
    modules.push({
      title: "Donaciones",
      value: `${displayCount(data.donations.total)} registradas`,
      icon: Heart,
      tone: "danger",
      path: "/app/donations",
      capability: "don.donations.read",
    });
  return (
    <section aria-labelledby="admin-summary-title">
      <DashboardCard
        title="Resumen por módulo"
        icon={ClipboardList}
        tone="success"
      >
        {" "}
        <div className="divide-y divide-erp-border">
          {modules.map((module) => (
            <ModuleRow
              key={module.title}
              module={module}
              allowed={hasCapability(permissionCodes, module.capability)}
            />
          ))}
        </div>
      </DashboardCard>
    </section>
  );
}
function ModuleRow({
  module,
  allowed,
}: {
  module: {
    title: string;
    value: string;
    icon: Icon;
    tone: Tone;
    path: string;
  };
  allowed: boolean;
}) {
  const IconComponent = module.icon;
  const content = (
    <>
      <IconTile icon={IconComponent} tone={module.tone} size="sm" />
      <span className="min-w-0 flex-1 text-body-small font-semibold text-erp-text">
        {module.title}
      </span>
      <span className="text-caption text-erp-text-muted">{module.value}</span>
      {allowed ? (
        <ChevronRight
          className="size-4 shrink-0 text-erp-text-muted"
          aria-hidden="true"
        />
      ) : null}
    </>
  );
  return allowed ? (
    <Link
      to={module.path}
      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erp-focus"
    >
      {content}
    </Link>
  ) : (
    <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      {content}
    </div>
  );
}

function ProcessStatus() {
  return (
    <section aria-labelledby="admin-process-title">
      <DashboardCard
        title="Estado de procesos"
        icon={CircleAlert}
        tone="warning"
      >
        <div className="flex min-h-36 items-center gap-4 rounded-control border border-dashed border-erp-border bg-erp-surface-subtle/50 px-4 py-4">
          <div className="grid size-20 shrink-0 place-items-center rounded-full border-8 border-dashed border-erp-border bg-erp-surface-raised text-center">
            <div>
              <p className="text-heading-3 font-bold leading-none text-erp-text">
                —
              </p>
              <p className="mt-1 text-caption text-erp-text-muted">
                Sin cálculo
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-body-small font-bold text-erp-text">
              <CircleAlert
                className="size-4 text-erp-accent"
                aria-hidden="true"
              />
              Información no disponible
            </div>
            <p className="mt-1.5 text-caption leading-relaxed text-erp-text-muted">
              No existe una definición institucional verificable para calcular
              un porcentaje global de procesos.
            </p>
          </div>
        </div>
      </DashboardCard>
    </section>
  );
}

function UpcomingActivities({
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
      <DashboardCard
        title="Próximas actividades"
        icon={CalendarDays}
        tone="info"
      >
        {isPending ? (
          <Skeleton className="h-52" />
        ) : isError ? (
          <InlineRetry
            message="No fue posible cargar actividades."
            onRetry={onRetry}
          />
        ) : upcoming.length ? (
          <div className="divide-y divide-erp-border">
            {upcoming.map((event) => (
              <UpcomingEvent key={event.publicId} event={event} />
            ))}
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
    <Link
      to={`/eventos/${event.publicId}`}
      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erp-focus"
    >
      <time
        dateTime={event.startAt}
        className="grid size-11 shrink-0 place-items-center rounded-control bg-status-info-surface text-center text-caption font-bold leading-tight text-status-info"
      >
        <span>
          {new Intl.DateTimeFormat("es-CR", {
            month: "short",
            timeZone: "America/Costa_Rica",
          })
            .format(date)
            .replace(".", "")
            .toUpperCase()}
        </span>
        <span className="text-body-small">
          {new Intl.DateTimeFormat("es-CR", {
            day: "2-digit",
            timeZone: "America/Costa_Rica",
          }).format(date)}
        </span>
      </time>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-body-small font-bold text-erp-text">
          {event.title}
        </h3>
        <p className="mt-0.5 truncate text-caption text-erp-text-muted">
          {formatEventTime(event.startAt)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </div>
      <ChevronRight
        className="size-4 shrink-0 text-erp-text-muted"
        aria-hidden="true"
      />
    </Link>
  );
}

function DashboardCard({
  title,
  description,
  icon: _IconComponent,
  tone: _tone,
  count,
  children,
}: {
  title: string;
  description?: string;
  icon: Icon;
  tone: Tone;
  count?: number;
  children: ReactNode;
}) {
  const id = `admin-${title.toLowerCase().replaceAll(" ", "-")}-title`;
  return (
    <Card className="h-full gap-0 border-erp-border bg-erp-surface-raised py-4 shadow-elevation-0">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div>
          <h2
            id={id}
            className="font-sans text-heading-3 font-bold leading-snug tracking-[-0.01em] text-erp-text"
          >
            {title}
          </h2>
          {description ? (
            <CardDescription className="mt-0.5 text-caption">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {count ? (
          <span className="rounded-full bg-status-danger px-2 py-0.5 text-caption font-bold text-white">
            {displayCount(count)}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="mt-3">{children}</CardContent>
    </Card>
  );
}
function InlineRetry({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="py-8 text-center">
      <p className="text-body-small text-erp-text-muted">{message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={onRetry}
      >
        Reintentar
      </Button>
    </div>
  );
}
function IconTile({
  icon: IconComponent,
  tone = "success",
  size = "default",
}: {
  icon: Icon;
  tone?: Tone;
  size?: "default" | "sm";
}) {
  const tones: Record<Tone, string> = {
    success: "bg-status-success-surface text-status-success",
    warning: "bg-status-warning-surface text-status-warning",
    danger: "bg-status-danger-surface text-status-danger",
    info: "bg-status-info-surface text-status-info",
    violet: "bg-status-info-surface text-status-info",
  };
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-control ${size === "sm" ? "size-8" : "size-10"} ${tones[tone]}`}
    >
      <IconComponent
        className={size === "sm" ? "size-4" : "size-5"}
        aria-hidden="true"
      />
    </span>
  );
}
function DashboardSkeleton() {
  return (
    <div
      className="mt-4 space-y-3"
      aria-label="Cargando indicadores administrativos"
    >
      <Skeleton className="h-38" />
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 min-[1200px]:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-35" />
        ))}
      </div>
      <div className="grid min-w-0 gap-3 min-[1200px]:grid-cols-3">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
function calendarActivities(
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
        })),
    );
  return activities;
}

function groupActivitiesByDay(
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
function calendarMonthFilters(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  return {
    from: civilDateKey(year, monthIndex + 1, 1),
    to: civilDateKey(year, monthIndex + 2, 0),
    page: 1,
    limit: 100,
  };
}
function civilMonthKey(month: Date) {
  return civilDateKey(month.getFullYear(), month.getMonth() + 1, 1).slice(0, 7);
}
function formatCalendarDay(value: string) {
  return formatCalendarDate(`${value}T12:00:00-06:00`, { dateStyle: "full" });
}
function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
function displayCount(value: number | string | null) {
  return value === null
    ? "—"
    : typeof value === "number"
      ? value.toLocaleString("es-CR")
      : value;
}
function formatDashboardDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-CR", {
        dateStyle: "full",
        timeZone: "America/Costa_Rica",
      }).format(date);
}
function formatEventTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-CR", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Costa_Rica",
  }).format(date);
}
function hasData(data: AdminDashboardData) {
  return Object.keys(data).length > 0;
}
