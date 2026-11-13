import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  FileText,
  Landmark,
  ReceiptText,
  RefreshCw,
  Scale,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { currentFinancialMonth, financialMonthInterval, formatFinancialCurrency, useTreasurySummary } from "@/features/financial";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { hasCapability } from "@/shared/security/access";
import { canUseTreasuryDashboard } from "../model/canUseTreasuryDashboard";
import type { QuickAction } from "./dashboard.types";
import { DashboardCard, DashboardSkeleton, IconTile } from "./primitives";
import { QuickActions } from "./sections/QuickActions";

type TreasuryDashboardProps = {
  permissionCodes?: readonly string[];
  userName?: string;
};

export function TreasuryDashboard({ permissionCodes, userName }: TreasuryDashboardProps) {
  if (!canUseTreasuryDashboard(permissionCodes)) return null;
  return <TreasuryDashboardContent permissionCodes={permissionCodes} userName={userName} />;
}

function TreasuryDashboardContent({ permissionCodes, userName }: TreasuryDashboardProps) {
  const canReadTreasury = hasCapability(permissionCodes, "fin.movements.read") && hasCapability(permissionCodes, "fin.charges.read");
  const interval = financialMonthInterval(currentFinancialMonth());
  const treasury = useTreasurySummary({ dateFrom: interval.dateFrom, dateTo: interval.dateTo }, canReadTreasury);
  const firstName = userName?.trim().split(/\s+/)[0];
  const actions = treasuryQuickActions(permissionCodes);

  if (canReadTreasury && treasury.isPending) return <section aria-busy="true"><TreasuryWelcome firstName={firstName} /><DashboardSkeleton /></section>;
  if (canReadTreasury && treasury.isError) return <section><TreasuryWelcome firstName={firstName} /><ErrorState className="mt-5" title="No fue posible cargar el resumen de Tesorería" message="Intente nuevamente para consultar el estado financiero actual." action={<Button size="sm" variant="outline" onClick={() => void treasury.refetch()}><RefreshCw aria-hidden="true" />Reintentar</Button>} /></section>;

  return <section className="@container space-y-4">
    <TreasuryWelcome firstName={firstName} />
    {treasury.data ? <TreasuryIndicators income={treasury.data.currentPeriod.income} expenses={treasury.data.currentPeriod.expenses} net={treasury.data.currentPeriod.net} receivables={treasury.data.receivables.pendingCharges} currency={treasury.data.currency} /> : <EmptyState title="No hay indicadores financieros disponibles." description="Los indicadores aparecen cuando cuenta con lectura de movimientos y cargos financieros." />}
    <div className="grid min-w-0 gap-3 @min-[700px]:grid-cols-2">
      {treasury.data ? <TreasuryAttention pendingCount={treasury.data.receivables.pendingChargeCount} reconciliationIssues={treasury.data.reconciliation.issues.length} /> : <EmptyState title="Atención financiera no disponible." description="No cuenta con los permisos combinados requeridos para consultar cargos y movimientos." />}
      <QuickActions actions={actions} />
    </div>
    <section className="rounded-surface border border-erp-border bg-erp-surface-raised p-5 shadow-elevation-0" aria-labelledby="financial-dashboard-link-title"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 id="financial-dashboard-link-title" className="text-heading-3 font-semibold text-erp-text">Análisis financiero</h2><p className="mt-1 text-body-small text-erp-text-muted">Consulte gráficos, filtros por período e historial financiero completo.</p></div><Link to="/app/financial/dashboard"><Button variant="outline">Abrir Dashboard financiero</Button></Link></div></section>
  </section>;
}

function TreasuryWelcome({ firstName }: { firstName?: string }) {
  return <header className="border-y border-erp-border bg-erp-surface-subtle px-5 py-6 sm:px-7 md:px-10 md:py-7 xl:-mx-6 xl:-mt-9"><div className="flex min-w-0 items-start gap-3 sm:gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-status-success-surface text-status-success"><Landmark className="size-6" aria-hidden="true" /></span><div className="min-w-0"><p className="text-caption font-bold uppercase tracking-[0.16em] text-status-success">Tesorería</p><h1 className="mt-1 font-sans text-heading-1 font-bold leading-tight tracking-[-0.025em] text-erp-navigation">Buenos días{firstName ? `, ${firstName}` : ""}</h1><p className="mt-1 text-body text-erp-text">Aquí tiene el resumen operativo de Tesorería de la ADI Curime.</p></div></div></header>;
}

function TreasuryIndicators({ income, expenses, net, receivables, currency }: { income: string; expenses: string; net: string; receivables: string; currency: string }) {
  const cards = [{ label: "Ingresos del período", value: income, icon: ArrowUpRight, tone: "success" as const }, { label: "Egresos del período", value: expenses, icon: ArrowDownRight, tone: "danger" as const }, { label: "Resultado neto", value: net, icon: Scale, tone: "info" as const }, { label: "Cuentas por cobrar", value: receivables, icon: CircleDollarSign, tone: "warning" as const }];
  return <section aria-label="Indicadores de Tesorería" className="grid min-w-0 gap-3 min-[480px]:grid-cols-2 @[960px]:grid-cols-4">{cards.map(({ label, value, icon, tone }) => <article key={label} className="flex min-h-38 flex-col rounded-surface border border-erp-border bg-erp-surface-raised p-5 shadow-elevation-0"><div className="flex items-start gap-3"><IconTile icon={icon} tone={tone} /><div><h2 className="text-label font-semibold text-erp-text">{label}</h2><p className="mt-0.5 text-caption text-erp-text-muted">Período actual</p></div></div><p className="mt-auto border-t border-erp-border pt-4 text-heading-3 font-bold tabular-nums text-erp-navigation">{formatFinancialCurrency(value, currency)}</p></article>)}</section>;
}

function TreasuryAttention({ pendingCount, reconciliationIssues }: { pendingCount?: number; reconciliationIssues?: number }) {
  const hasPendingCharges = (pendingCount ?? 0) > 0;
  const hasIssues = (reconciliationIssues ?? 0) > 0;
  return <section aria-label="Atención requerida"><DashboardCard title="Atención requerida" description="Pendientes financieros actuales" icon={TriangleAlert} tone="warning" count={(pendingCount ?? 0) + (reconciliationIssues ?? 0)}>{hasPendingCharges || hasIssues ? <div className="space-y-3">{hasPendingCharges ? <Link to="/app/financial/charges" className="flex items-center gap-3 rounded-control border border-erp-border px-3 py-2.5 hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"><IconTile icon={ReceiptText} tone="warning" size="sm" /><span className="text-body-small font-semibold text-erp-text">{pendingCount} cargo(s) pendiente(s)</span></Link> : null}{hasIssues ? <Link to="/app/financial/movements" className="flex items-center gap-3 rounded-control border border-erp-border px-3 py-2.5 hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"><IconTile icon={TriangleAlert} tone="danger" size="sm" /><span className="text-body-small font-semibold text-erp-text">{reconciliationIssues} alerta(s) de trazabilidad</span></Link> : null}</div> : <EmptyState className="py-8" title="No hay pendientes financieros." description="No se registran cargos pendientes ni alertas de trazabilidad." />}</DashboardCard></section>;
}

function treasuryQuickActions(permissionCodes: readonly string[] | undefined): QuickAction[] {
  const actions: QuickAction[] = [];
  if (hasCapability(permissionCodes, "fin.movements.read")) actions.push({ label: "Movimientos", path: "/app/financial/movements", capability: "fin.movements.read", icon: FileText, tone: "info" });
  else if (hasCapability(permissionCodes, "fin.movements.create")) actions.push({ label: "Registrar movimiento", path: "/app/financial/movements", capability: "fin.movements.create", icon: FileText, tone: "success" });
  if (hasCapability(permissionCodes, "fin.charges.read")) actions.push({ label: "Cargos y pagos", path: "/app/financial/charges", capability: "fin.charges.read", icon: ReceiptText, tone: "warning" });
  if (hasCapability(permissionCodes, "fin.dinadeco.read")) actions.push({ label: "Reporte DINADECO", path: "/app/financial/dinadeco", capability: "fin.dinadeco.read", icon: FileText, tone: "success" });
  if (hasCapability(permissionCodes, "don.donations.read")) actions.push({ label: "Donaciones", path: "/app/donations", capability: "don.donations.read", icon: CircleDollarSign, tone: "danger" });
  if (hasCapability(permissionCodes, "don.requests.read")) actions.push({ label: "Solicitudes de donación", path: "/app/donation-requests", capability: "don.requests.read", icon: ReceiptText, tone: "info" });
  return actions;
}
