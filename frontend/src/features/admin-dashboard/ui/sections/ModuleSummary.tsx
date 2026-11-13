import { CalendarCheck, ChevronRight, ClipboardList, Heart, Package, Users, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { hasCapability, type AccessCapability } from "@/shared/security/access";
import type { AdminDashboardData } from "../../model/adminDashboard.types";
import { DashboardCard, IconTile } from "../primitives";
import { displayCount } from "../../model/displayCount";
import type { Icon, Tone } from "../dashboard.types";

type ModuleItem = {
  title: string;
  value: string;
  icon: Icon;
  tone: Tone;
  path: string;
  capability: AccessCapability;
};

export function ModuleSummary({
  data,
  permissionCodes,
}: {
  data: AdminDashboardData;
  permissionCodes?: readonly string[];
}) {
  const modules: ModuleItem[] = [];
  if (data.affiliates)
    modules.push({ title: "Afiliados", value: `${displayCount(data.affiliates.active)} activos`, icon: Users, tone: "success", path: "/app/admin/affiliates", capability: "adm.affiliates.read" });
  if (data.reservations)
    modules.push({ title: "Reservas", value: `${displayCount(data.reservations.total)} total`, icon: CalendarCheck, tone: "info", path: "/app/reservations", capability: "res.reservations.read" });
  if (data.inventory)
    modules.push({ title: "Inventario", value: `${displayCount(data.inventory.totalItems)} artículos`, icon: Package, tone: "warning", path: "/inventory", capability: "inv.inventory.read" });
  if (data.assemblies)
    modules.push({ title: "Asambleas", value: `${displayCount(data.assemblies.scheduled)} programadas`, icon: UsersRound, tone: "success", path: "/app/admin/assemblies", capability: "governance.assembly.session" });
  if (data.donations)
    modules.push({ title: "Donaciones", value: `${displayCount(data.donations.total)} registradas`, icon: Heart, tone: "danger", path: "/app/donations", capability: "don.donations.read" });
  return (
    <section aria-labelledby="admin-summary-title">
      <DashboardCard title="Resumen por módulo" icon={ClipboardList} tone="success">
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

function ModuleRow({ module, allowed }: { module: ModuleItem; allowed: boolean }) {
  const content = (
    <>
      <IconTile icon={module.icon} tone={module.tone} size="sm" />
      <span className="min-w-0 flex-1 text-body-small font-semibold text-erp-text">{module.title}</span>
      <span className="text-caption text-erp-text-muted">{module.value}</span>
      {allowed ? <ChevronRight className="size-4 shrink-0 text-erp-text-muted" aria-hidden="true" /> : null}
    </>
  );
  return allowed ? (
    <Link to={module.path} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">
      {content}
    </Link>
  ) : (
    <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">{content}</div>
  );
}
