import type { LucideIcon } from "lucide-react";
import { Boxes, FileClock, Package, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import type { InventoryReportSummary } from "@/types/inventory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/skeleton";
import { canUseOperatorDashboard } from "../model/canUseOperatorDashboard";

type OperatorDashboardProps = {
  permissionCodes?: readonly string[];
  userName?: string;
  canViewInventory: boolean;
  summary: InventoryReportSummary | null;
  loading: boolean;
  summaryUnavailable: boolean;
  quickActions: readonly { label: string; path: string; icon?: LucideIcon }[];
};

export function OperatorDashboard({ permissionCodes, userName, canViewInventory, summary, loading, summaryUnavailable, quickActions }: OperatorDashboardProps) {
  if (!canUseOperatorDashboard(permissionCodes)) return null;
  const firstName = userName?.trim().split(/\s+/)[0];
  return <section className="@container space-y-4">
    <header className="border-y border-erp-border bg-erp-surface-subtle px-5 py-6 sm:px-7 md:px-10 md:py-7 xl:-mx-6 xl:-mt-9"><div className="flex min-w-0 items-start gap-3 sm:gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-status-warning-surface text-status-warning"><Package className="size-6" aria-hidden="true" /></span><div className="min-w-0"><p className="text-caption font-bold uppercase tracking-[0.16em] text-status-warning">Operaciones</p><h1 className="mt-1 font-sans text-heading-1 font-bold leading-tight tracking-[-0.025em] text-erp-navigation">Buenos días{firstName ? `, ${firstName}` : ""}</h1><p className="mt-1 text-body text-erp-text">Aquí tiene el estado operativo de los módulos autorizados.</p></div></div></header>
    {canViewInventory ? <InventorySummary summary={summary} loading={loading} unavailable={summaryUnavailable} /> : <EmptyState title="No hay indicadores operativos disponibles." description="Los indicadores aparecen cuando su capacidad permite consultar un módulo operativo." />}
    <section aria-labelledby="operator-actions-title"><Card className="border-erp-border bg-erp-surface-raised shadow-elevation-0"><CardContent className="p-5"><h2 id="operator-actions-title" className="text-heading-3 font-semibold text-erp-text">Accesos autorizados</h2><p className="mt-1 text-body-small text-erp-text-muted">Módulos y acciones disponibles según sus capacidades efectivas.</p>{quickActions.length ? <nav aria-label="Accesos operativos autorizados" className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{quickActions.map(({ label, path, icon: Icon }) => <Link key={path} to={path} className="group flex min-h-15 items-center gap-3 rounded-control border border-erp-border bg-erp-surface-subtle/70 px-3.5 transition-colors hover:border-erp-border-strong hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">{Icon ? <span className="grid size-9 shrink-0 place-items-center rounded-control bg-status-success-surface text-status-success"><Icon className="size-4" aria-hidden="true" /></span> : null}<span className="text-body-small font-semibold text-erp-text">{label}</span></Link>)}</nav> : <EmptyState className="py-8" title="No hay accesos disponibles." description="No existe una ruta funcional equivalente a sus capacidades actuales." />}</CardContent></Card></section>
  </section>;
}

function InventorySummary({ summary, loading, unavailable }: { summary: InventoryReportSummary | null; loading: boolean; unavailable: boolean }) {
  if (loading) return <section aria-label="Cargando resumen de inventario" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></section>;
  if (!summary) return <EmptyState title={unavailable ? "El resumen de inventario no está disponible." : "No hay datos de inventario para mostrar."} description="Puede consultar el módulo de Inventario si cuenta con acceso." />;
  const indicators = [{ label: "Artículos activos", value: summary.activeItems, icon: Package, attention: false }, { label: "Stock bajo", value: summary.lowStockCount, icon: TriangleAlert, attention: summary.lowStockCount > 0 }, { label: "Artículos agotados", value: summary.outOfStockCount, icon: Boxes, attention: summary.outOfStockCount > 0 }, { label: "Préstamos vencidos", value: summary.overdueLoans, icon: FileClock, attention: summary.overdueLoans > 0 }];
  return <section aria-label="Resumen operativo de inventario" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{indicators.map(({ label, value, icon: Icon, attention }) => <Card key={label} size="sm" className={`border-erp-border bg-erp-surface-raised shadow-elevation-0 ${attention ? "border-status-warning-border" : ""}`}><CardHeader className="grid grid-cols-[1fr_auto]"><div><CardDescription>{label}</CardDescription><CardTitle className="mt-2 text-heading-1 font-bold tabular-nums text-erp-navigation">{value}</CardTitle></div><span className={`grid size-10 place-items-center rounded-control ${attention ? "bg-status-warning-surface text-status-warning" : "bg-status-success-surface text-status-success"}`}><Icon className="size-5" aria-hidden="true" /></span></CardHeader></Card>)}</section>;
}
