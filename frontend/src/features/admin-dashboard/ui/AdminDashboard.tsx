import { useState } from "react";
import {
  CalendarCheck,
  FileText,
  Heart,
  Package,
  RefreshCw,
  Users,
  UsersRound,
} from "lucide-react";
import { usePublicEvents } from "@/features/events";
import { useAssemblies } from "@/features/assemblies";
import { useReservationsList } from "@/features/reservations";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { hasCapability } from "@/shared/security/access";
import { currentCostaRicaMonth } from "@/shared/lib/calendar";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import type { AdminDashboardData } from "../model/adminDashboard.types";
import { canUseAdministrativeDashboard } from "../model/canUseAdministrativeDashboard";
import { calendarMonthFilters } from "../model/calendar";
import { InstitutionalDashboardWelcome } from "./sections/InstitutionalWelcome";
import { KpiRow } from "./sections/KpiRow";
import { AttentionPanel } from "./sections/AttentionPanel";
import { QuickActions } from "./sections/QuickActions";
import { InstitutionalCalendar } from "./sections/InstitutionalCalendar";
import { ModuleSummary } from "./sections/ModuleSummary";
import { ProcessStatus } from "./sections/ProcessStatus";
import { UpcomingActivities } from "./sections/UpcomingActivities";
import { DashboardSkeleton } from "./primitives";
import type { QuickAction } from "./dashboard.types";

export { InstitutionalDashboardWelcome } from "./sections/InstitutionalWelcome";
type AdminDashboardProps = {
  permissionCodes?: readonly string[];
  userName?: string;
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
  const canReadAdministrativeMetrics = canUseAdministrativeDashboard(
    permissionCodes,
  );

  if (!canReadAdministrativeMetrics) {
    return <InstitutionalDashboardWelcome fullName={userName} />;
  }

  return (
    <AdminDashboardContent
      permissionCodes={permissionCodes}
      userName={userName}
    />
  );
}

function AdminDashboardContent({
  permissionCodes,
  userName,
}: AdminDashboardProps) {
  const dashboard = useAdminDashboard(true);
  const events = usePublicEvents();
  const [calendarMonth, setCalendarMonth] = useState(() =>
    currentCostaRicaMonth(),
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

  if (dashboard.isPending)
    return (
      <section aria-busy="true">
        <InstitutionalDashboardWelcome fullName={userName} />
        <DashboardSkeleton />
      </section>
    );
  if (dashboard.isError)
    return (
      <section>
        <InstitutionalDashboardWelcome fullName={userName} />
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
        <InstitutionalDashboardWelcome
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

  return (
    <section className="@container space-y-4">
      <InstitutionalDashboardWelcome
        fullName={userName}
        generatedAt={metadata.generatedAt}
      />
      <KpiRow
        data={data}
        permissionCodes={permissionCodes}
      />
      <div className="grid min-w-0 gap-3 @min-[700px]:grid-cols-2 @min-[880px]:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <AttentionPanel
          data={data}
          permissionCodes={permissionCodes}
        />
        <QuickActions
          actions={quickActions.filter((action) =>
            hasCapability(permissionCodes, action.capability),
          )}
        />
        <div className="grid min-w-0 [&>section]:min-w-0 @min-[700px]:col-span-2 @min-[880px]:col-span-1">
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
            sources={{
              events: {
                enabled: true,
                isPending: events.isPending,
                isError: events.isError,
                onRetry: () => void events.refetch(),
              },
              reservations: {
                enabled: canReadReservations,
                isPending: reservationCalendar.isPending,
                isError: reservationCalendar.isError,
                onRetry: () => void reservationCalendar.refetch(),
              },
              assemblies: {
                enabled: canReadAssemblies,
                isPending: assembliesCalendar.isPending,
                isError: assembliesCalendar.isError,
                onRetry: () => void assembliesCalendar.refetch(),
              },
            }}
          />
        </div>
      </div>
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



function hasData(data: AdminDashboardData) {
  return Object.keys(data).length > 0;
}
