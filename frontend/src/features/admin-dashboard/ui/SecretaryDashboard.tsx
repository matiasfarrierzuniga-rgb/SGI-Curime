import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  ContactRound,
  FilePenLine,
  HandHeart,
  Landmark,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { useAssemblies } from "@/features/assemblies";
import { usePublicEvents } from "@/features/events";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { hasCapability } from "@/shared/security/access";
import { currentCostaRicaMonth } from "@/shared/lib/calendar";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import type { AdminDashboardData } from "../model/adminDashboard.types";
import { canUseSecretaryDashboard } from "../model/canUseSecretaryDashboard";
import type { QuickAction } from "./dashboard.types";
import { DashboardSkeleton } from "./primitives";
import { AttentionPanel } from "./sections/AttentionPanel";
import { InstitutionalCalendar } from "./sections/InstitutionalCalendar";
import { QuickActions } from "./sections/QuickActions";
import { UpcomingActivities } from "./sections/UpcomingActivities";

type SecretaryDashboardProps = {
  permissionCodes?: readonly string[];
  userName?: string;
};

const secretaryActions: readonly QuickAction[] = [
  { label: "Consultar padrón", path: "/app/admin/affiliates", capability: "padron.affiliate.read", icon: ContactRound, tone: "success" },
  { label: "Revisar solicitudes", path: "/app/admin/requests", capability: "padron.application.review", icon: ClipboardList, tone: "warning" },
  { label: "Gestionar Junta Directiva", path: "/app/admin/institutional-board", capability: "adm.institutional-board.read", icon: Landmark, tone: "success" },
  { label: "Gestionar asambleas", path: "/app/admin/assemblies", capability: "governance.assembly.session", icon: UsersRound, tone: "success" },
  { label: "Gestionar eventos", path: "/app/events", capability: "events.proposal.review", icon: CalendarDays, tone: "warning" },
  { label: "Voluntariado", path: "/app/admin/volunteering", capability: "volunteer.campaign.manage", icon: HandHeart, tone: "info" },
];

export function SecretaryDashboard({ permissionCodes, userName }: SecretaryDashboardProps) {
  if (!canUseSecretaryDashboard(permissionCodes)) return null;
  return <SecretaryDashboardContent permissionCodes={permissionCodes} userName={userName} />;
}

function SecretaryDashboardContent({ permissionCodes, userName }: SecretaryDashboardProps) {
  const dashboard = useAdminDashboard(true);
  const events = usePublicEvents();
  const assemblies = useAssemblies(true);
  const [calendarMonth, setCalendarMonth] = useState(() => currentCostaRicaMonth());

  if (dashboard.isPending) {
    return <section aria-busy="true"><SecretaryWelcome fullName={userName} /><DashboardSkeleton /></section>;
  }
  if (dashboard.isError) {
    return <section><SecretaryWelcome fullName={userName} /><ErrorState className="mt-5" title="No fue posible cargar los indicadores" message="Intente nuevamente para consultar la gestión institucional actual." action={<Button variant="outline" size="sm" onClick={() => void dashboard.refetch()}><RefreshCw aria-hidden="true" />Reintentar</Button>} /></section>;
  }

  const { data, metadata } = dashboard.data;
  return (
    <section className="@container space-y-4">
      <SecretaryWelcome fullName={userName} generatedAt={metadata.generatedAt} />
      <SecretaryIndicators data={data} />
      <div className="grid min-w-0 gap-3 @min-[700px]:grid-cols-2 @min-[880px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
        <AttentionPanel data={data} permissionCodes={permissionCodes} />
        <QuickActions actions={secretaryActions.filter((action) => hasCapability(permissionCodes, action.capability))} />
        <div className="min-w-0 @min-[700px]:col-span-2 @min-[880px]:col-span-1">
          <InstitutionalCalendar month={calendarMonth} onMonthChange={setCalendarMonth} events={events.data} assemblies={assemblies.data} includeReservations={false} includeAssemblies agendaPath="/app/events" permissionCodes={permissionCodes} enableManagementActions sources={{ events: { enabled: true, isPending: events.isPending, isError: events.isError, onRetry: () => void events.refetch() }, reservations: { enabled: false, isPending: false, isError: false, onRetry: () => undefined }, assemblies: { enabled: true, isPending: assemblies.isPending, isError: assemblies.isError, onRetry: () => void assemblies.refetch() } }} />
        </div>
      </div>
      <div className="grid min-w-0 gap-3 @min-[700px]:grid-cols-2">
        <UpcomingActivities events={events.data} isPending={events.isPending} isError={events.isError} onRetry={() => void events.refetch()} />
        {!data.affiliateRequests && !data.assemblies ? <EmptyState title="No hay indicadores autorizados para esta sesión." description="Los indicadores aparecen únicamente cuando su capacidad permite consultar el módulo correspondiente." /> : null}
      </div>
    </section>
  );
}

function SecretaryWelcome({ fullName, generatedAt }: { fullName?: string; generatedAt?: string }) {
  const firstName = fullName?.trim().split(/\s+/)[0];
  return <header className="border-y border-erp-border bg-erp-surface-subtle px-5 py-6 sm:px-7 md:px-10 md:py-7 xl:-mx-6 xl:-mt-9"><div className="flex min-w-0 items-start gap-3 sm:gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-status-success-surface text-status-success"><FilePenLine className="size-6" aria-hidden="true" /></span><div className="min-w-0"><p className="text-caption font-bold uppercase tracking-[0.16em] text-status-success">Secretaría</p><h1 className="mt-1 font-sans text-heading-1 font-bold leading-tight tracking-[-0.025em] text-erp-navigation">Buenos días{firstName ? `, ${firstName}` : ""}</h1><p className="mt-1 text-body text-erp-text">Aquí tiene el resumen de seguimiento institucional de la ADI Curime.</p>{generatedAt ? <time className="mt-3 block text-body-small text-erp-text-muted" dateTime={generatedAt}>Actualizado {new Intl.DateTimeFormat("es-CR", { dateStyle: "long", timeZone: "America/Costa_Rica" }).format(new Date(generatedAt))}</time> : null}</div></div></header>;
}

function SecretaryIndicators({ data }: { data: AdminDashboardData }) {
  type SecretaryIndicator = {
    label: string;
    value: number;
    detail: string;
    icon: LucideIcon;
    tone: "warning" | "success";
  };
  const cards: SecretaryIndicator[] = [
    data.affiliateRequests ? { label: "Solicitudes pendientes", value: data.affiliateRequests.pending, detail: "Por revisar en afiliación", icon: ClipboardList, tone: "warning" as const } : null,
    data.assemblies ? { label: "Asambleas programadas", value: data.assemblies.scheduled, detail: "Gestión institucional vigente", icon: UsersRound, tone: "success" as const } : null,
  ].filter((card): card is SecretaryIndicator => card !== null);
  if (!cards.length) return null;
  return <section aria-label="Indicadores de Secretaría" className="grid min-w-0 gap-3 min-[480px]:grid-cols-2">{cards.map(({ label, value, detail, icon: Icon, tone }) => <article key={label} className="flex min-h-38 flex-col rounded-surface border border-erp-border bg-erp-surface-raised p-5 shadow-elevation-0"><div className="flex items-start gap-4"><span className={`grid size-12 shrink-0 place-items-center rounded-full ${tone === "warning" ? "bg-status-warning-surface text-status-warning" : "bg-status-success-surface text-status-success"}`}><Icon className="size-5" aria-hidden="true" /></span><div><h2 className="text-label font-semibold text-erp-text">{label}</h2><p className="mt-0.5 text-caption text-erp-text-muted">{detail}</p></div></div><p className="mt-auto border-t border-erp-border pt-4 text-heading-1 font-bold leading-none tabular-nums text-erp-navigation">{new Intl.NumberFormat("es-CR").format(value)}</p></article>)}</section>;
}
