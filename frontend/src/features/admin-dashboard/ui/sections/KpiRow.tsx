import { CalendarCheck, Package, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactElement } from "react";
import { hasCapability } from "@/shared/security/access";
import type { AdminDashboardData } from "../../model/adminDashboard.types";
import { IconTile } from "../primitives";
import { displayCount } from "../../model/displayCount";
import type { Icon, Tone } from "../dashboard.types";

export function KpiRow({
  data,
  permissionCodes,
}: {
  data: AdminDashboardData;
  permissionCodes?: readonly string[];
}) {
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
            className="grid size-8 place-items-center rounded-full text-erp-navigation transition-colors hover:bg-status-success-surface focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus"
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
