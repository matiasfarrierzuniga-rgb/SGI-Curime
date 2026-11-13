import { AlertTriangle, ChevronRight, FileClock, Package, PackageX, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/shared/ui/EmptyState";
import { hasCapability, type AccessCapability } from "@/shared/security/access";
import type { AdminDashboardData } from "../../model/adminDashboard.types";
import { DashboardCard, IconTile } from "../primitives";
import { displayCount } from "../../model/displayCount";
import type { Icon, Tone } from "../dashboard.types";

type AttentionItem = {
  label: string;
  detail: string;
  count: number;
  icon: Icon;
  tone: Tone;
  path: string;
  capability: AccessCapability;
};

export function AttentionPanel({
  data,
  permissionCodes,
}: {
  data: AdminDashboardData;
  permissionCodes?: readonly string[];
}) {
  const items: AttentionItem[] = [];
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
      <ChevronRight className="size-4 shrink-0 text-erp-text-muted" aria-hidden="true" />
    </Link>
  );
}
