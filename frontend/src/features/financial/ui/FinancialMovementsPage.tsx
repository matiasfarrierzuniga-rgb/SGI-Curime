import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  ReceiptText,
  Scale,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth";
import { getErrorMessage } from "@/shared/lib/errors";
import { hasCapability } from "@/shared/security/access";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { LoadingState } from "@/shared/ui/LoadingState";
import { MetricCard } from "@/shared/ui/MetricCard";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Pagination } from "@/shared/ui/Pagination";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import {
  useFinancialMovementSummary,
  useFinancialMovementsList,
} from "../hooks/useFinancial";
import {
  FINANCIAL_MOVEMENT_METHODS,
  FINANCIAL_MOVEMENT_STATUSES,
  FINANCIAL_MOVEMENT_TYPES,
  type FinancialMovementListFilters,
  type FinancialMovementMethod,
  type FinancialMovementStatus,
  type FinancialMovementType,
} from "../model/financial.types";
import { FinancialMovementDetailModal } from "./FinancialMovementDetailModal";
import { FinancialMovementFormModal } from "./FinancialMovementFormModal";
import { FinancialSectionNav } from "./FinancialSectionNav";
import {
  financialMovementSourceLabel,
  financialMovementStatusLabel,
  financialMovementTypeLabel,
  formatFinancialCurrency,
  formatFinancialDate,
  paymentMethodLabel,
} from "./financialPresentation";

const initialFilters: FinancialMovementListFilters = { page: 1, limit: 20 };

export function FinancialMovementsPage() {
  const { user } = useAuth();
  const [filters, setFilters] =
    useState<FinancialMovementListFilters>(initialFilters);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const list = useFinancialMovementsList(filters);
  const summary = useFinancialMovementSummary({
    type: filters.type,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    status: filters.status,
    method: filters.method,
    search: filters.search,
  });
  const hasActiveFilters = Boolean(
    filters.type ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.status ||
    filters.method ||
    filters.search,
  );
  const summaryStateLabel = hasActiveFilters
    ? "Filtros aplicados"
    : "Todos los movimientos";
  const update = (change: Partial<FinancialMovementListFilters>) =>
    setFilters((current) => ({ ...current, ...change, page: 1 }));
  const mayCreate = hasCapability(
    user?.permissionCodes,
    "fin.movements.create",
  );
  return (
    <section className="space-y-6">
      <PageHeader
        context="Gestión financiera"
        title="Reporte operativo financiero"
        description="Analice ingresos, egresos, balance y fuentes de movimiento por período."
        actions={
          mayCreate ? (
            <Button type="button" onClick={() => setCreating(true)}>
              Registrar movimiento
            </Button>
          ) : undefined
        }
      />
      <FinancialSectionNav />
      <form
        className="grid gap-4 rounded-surface border border-border-default bg-surface-card p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        onSubmit={(event) => event.preventDefault()}
      >
        <label
          className="grid gap-1 text-sm font-semibold"
          htmlFor="movement-filter-type"
        >
          Tipo
          <select
            className="min-h-11 rounded-control border border-border-default bg-control px-3 text-base font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            id="movement-filter-type"
            value={filters.type ?? ""}
            onChange={(event) =>
              update({
                type: event.target.value
                  ? (event.target.value as FinancialMovementType)
                  : undefined,
              })
            }
          >
            <option value="">Todos los tipos</option>
            {FINANCIAL_MOVEMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {financialMovementTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <label
          className="grid gap-1 text-sm font-semibold"
          htmlFor="movement-filter-from"
        >
          Desde
          <input
            className="min-h-11 rounded-control border border-border-default bg-control px-3 text-base font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            id="movement-filter-from"
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(event) =>
              update({ dateFrom: event.target.value || undefined })
            }
          />
        </label>
        <label
          className="grid gap-1 text-sm font-semibold"
          htmlFor="movement-filter-to"
        >
          Hasta
          <input
            className="min-h-11 rounded-control border border-border-default bg-control px-3 text-base font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            id="movement-filter-to"
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(event) =>
              update({ dateTo: event.target.value || undefined })
            }
          />
        </label>
        <label
          className="grid gap-1 text-sm font-semibold"
          htmlFor="movement-filter-status"
        >
          Estado
          <select
            className="min-h-11 rounded-control border border-border-default bg-control px-3 text-base font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            id="movement-filter-status"
            value={filters.status ?? ""}
            onChange={(event) =>
              update({
                status: event.target.value
                  ? (event.target.value as FinancialMovementStatus)
                  : undefined,
              })
            }
          >
            <option value="">Todos los estados</option>
            {FINANCIAL_MOVEMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {financialMovementStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label
          className="grid gap-1 text-sm font-semibold"
          htmlFor="movement-filter-method"
        >
          Método
          <select
            className="min-h-11 rounded-control border border-border-default bg-control px-3 text-base font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            id="movement-filter-method"
            value={filters.method ?? ""}
            onChange={(event) =>
              update({
                method: event.target.value
                  ? (event.target.value as FinancialMovementMethod)
                  : undefined,
              })
            }
          >
            <option value="">Todos los métodos</option>
            {FINANCIAL_MOVEMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {paymentMethodLabel(method)}
              </option>
            ))}
          </select>
        </label>
        <label
          className="grid gap-1 text-sm font-semibold sm:col-span-2 xl:col-span-1"
          htmlFor="movement-filter-search"
        >
          Concepto o referencia
          <input
            className="min-h-11 rounded-control border border-border-default bg-control px-3 text-base font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            id="movement-filter-search"
            type="search"
            maxLength={150}
            value={filters.search ?? ""}
            onChange={(event) =>
              update({ search: event.target.value || undefined })
            }
          />
        </label>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            disabled={!hasActiveFilters}
            onClick={() => setFilters(initialFilters)}
          >
            Limpiar filtros
          </Button>
        </div>
      </form>
      <section aria-labelledby="financial-summary-title" className="space-y-4">
        <h2 id="financial-summary-title">Resumen del período</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.isPending ? (
            <div className="sm:col-span-2 xl:col-span-4">
              <LoadingState label="Calculando resumen financiero..." />
            </div>
          ) : null}
          {summary.isError ? (
            <div className="sm:col-span-2 xl:col-span-4">
              <ErrorState
                title="No fue posible cargar el resumen"
                message={getErrorMessage(summary.error)}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void summary.refetch()}
                  >
                    Reintentar
                  </Button>
                }
              />
            </div>
          ) : null}
          {summary.data ? (
            <>
              <Summary
                label="Ingresos"
                value={formatFinancialCurrency(
                  summary.data.totalIncome,
                  summary.data.currency,
                )}
                icon={<ArrowUpRight />}
                state="success"
                stateLabel={summaryStateLabel}
              />
              <Summary
                label="Movimientos de ingreso"
                value={formatCount(summary.data.incomeCount)}
                icon={<ReceiptText />}
                state="neutral"
                stateLabel={summaryStateLabel}
              />
              <Summary
                label="Promedio por movimiento de ingreso"
                value={formatFinancialCurrency(
                  summary.data.incomeAverage,
                  summary.data.currency,
                )}
                icon={<ArrowUpRight />}
                state="neutral"
                stateLabel={summaryStateLabel}
              />
              <Summary
                label="Egresos"
                value={formatFinancialCurrency(
                  summary.data.totalExpenses,
                  summary.data.currency,
                )}
                icon={<ArrowDownRight />}
                state="warning"
                stateLabel={summaryStateLabel}
              />
              <Summary
                label="Movimientos de egreso"
                value={formatCount(summary.data.expenseCount)}
                icon={<ReceiptText />}
                state="neutral"
                stateLabel={summaryStateLabel}
              />
              <Summary
                label="Promedio por movimiento de egreso"
                value={formatFinancialCurrency(
                  summary.data.expenseAverage,
                  summary.data.currency,
                )}
                icon={<ArrowDownRight />}
                state="neutral"
                stateLabel={summaryStateLabel}
              />
              <Summary
                label="Balance"
                value={formatFinancialCurrency(
                  summary.data.balance,
                  summary.data.currency,
                )}
                icon={<Scale />}
                state="neutral"
                stateLabel={summaryStateLabel}
              />
              <Summary
                label="Total de movimientos"
                value={formatCount(summary.data.movementCount)}
                icon={<ReceiptText />}
                state="neutral"
                stateLabel={summaryStateLabel}
              />
            </>
          ) : null}
        </div>
        {summary.data ? (
          <div className="space-y-3">
            <h3>Distribución por fuente</h3>
            <p className="text-sm text-foreground-muted">
              Los totales excluyen movimientos anulados. Los registros
              históricos sin estado se mantienen; pagos pendientes o cancelados
              no se contabilizan como ingresos.
            </p>
            {summary.data.bySource.length === 0 ? (
              <p className="rounded-surface border border-border-default bg-surface-muted p-4 text-sm text-foreground-muted">
                No hay movimientos para distribuir en el período seleccionado.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {summary.data.bySource.map((source) => (
                  <li
                    key={source.source}
                    className="rounded-surface border border-border-default bg-surface-card p-4"
                  >
                    <h4 className="font-semibold">
                      {financialMovementSourceLabel(source.source)}
                    </h4>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-foreground-muted">Ingresos</dt>
                        <dd className="font-semibold tabular-nums">
                          {formatFinancialCurrency(
                            source.incomeTotal,
                            summary.data.currency,
                          )}{" "}
                          · {formatCount(source.incomeCount)} mov.
                        </dd>
                      </div>
                      <div>
                        <dt className="text-foreground-muted">Egresos</dt>
                        <dd className="font-semibold tabular-nums">
                          {formatFinancialCurrency(
                            source.expenseTotal,
                            summary.data.currency,
                          )}{" "}
                          · {formatCount(source.expenseCount)} mov.
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
        {summary.data ? (
          <div className="space-y-3">
            <h3>Pagos confirmados por método</h3>
            <p className="text-sm text-foreground-muted">
              Este subtotal de pagos de cargos de reserva ya forma parte de los
              ingresos; no debe sumarse nuevamente.
            </p>
            {summary.data.confirmedPayments.byMethod.length === 0 ? (
              <p className="rounded-surface border border-border-default bg-surface-muted p-4 text-sm text-foreground-muted">
                No hay pagos confirmados en el período y filtro seleccionados.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {summary.data.confirmedPayments.byMethod.map((payment) => (
                  <li
                    key={payment.method}
                    className="flex items-start justify-between gap-4 rounded-surface border border-border-default bg-surface-card p-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <CreditCard
                        aria-hidden="true"
                        className="mt-0.5 size-5 shrink-0 text-foreground-muted"
                      />
                      <div>
                        <h4 className="font-semibold">
                          {paymentMethodLabel(payment.method)}
                        </h4>
                        <p className="text-sm text-foreground-muted">
                          {formatCount(payment.count)} pagos confirmados
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">
                      {formatFinancialCurrency(
                        payment.total,
                        summary.data.currency,
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </section>
      {list.isPending ? (
        <LoadingState label="Cargando movimientos financieros..." />
      ) : null}
      {list.isError ? (
        <ErrorState
          title="No fue posible cargar los movimientos"
          message={getErrorMessage(list.error)}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void list.refetch()}
            >
              Reintentar
            </Button>
          }
        />
      ) : null}
      {list.data?.data.length === 0 ? (
        <EmptyState
          title="No hay movimientos financieros"
          description={
            hasActiveFilters
              ? "No hay movimientos que coincidan con los filtros aplicados."
              : "Registre un ingreso o egreso manual para iniciar el historial."
          }
          action={
            hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setFilters(initialFilters)}
              >
                Limpiar filtros
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {list.data?.data.length ? (
        <>
          <div
            className="overflow-x-auto rounded-surface border border-border-default"
            tabIndex={0}
            aria-label="Listado de movimientos financieros"
          >
            <table className="min-w-[850px] w-full text-left text-sm">
              <thead className="bg-surface-muted text-foreground-muted">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Tipo y estado</th>
                  <th className="p-3">Concepto</th>
                  <th className="p-3">Monto</th>
                  <th className="p-3">Fuente</th>
                  <th className="p-3">Registró</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {list.data.data.map((movement) => (
                  <tr
                    key={movement.id}
                    className="border-t border-border-default align-top transition-colors hover:bg-surface-muted/60"
                  >
                    <td className="p-3 whitespace-nowrap">
                      {formatFinancialDate(movement.occurredAt)}
                    </td>
                    <td className="space-y-1 p-3">
                      <StatusBadge
                        variant={
                          movement.type === "INCOME" ? "success" : "warning"
                        }
                      >
                        {financialMovementTypeLabel(movement.type)}
                      </StatusBadge>
                      <StatusBadge
                        variant={
                          movement.status === "POSTED" ? "success" : "neutral"
                        }
                      >
                        {financialMovementStatusLabel(movement.status)}
                      </StatusBadge>
                    </td>
                    <td className="p-3 max-w-sm break-words">
                      {movement.description}
                    </td>
                    <td className="p-3 whitespace-nowrap font-semibold">
                      {formatFinancialCurrency(
                        movement.amount,
                        movement.currency,
                      )}
                    </td>
                    <td className="p-3">
                      {financialMovementSourceLabel(movement.source)}
                    </td>
                    <td className="p-3">
                      {movement.recordedById
                        ? `Usuario #${movement.recordedById}`
                        : "Sin registro"}
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedId(movement.id)}
                      >
                        Ver detalle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={list.data.page}
            total={list.data.total}
            limit={list.data.limit}
            onChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </>
      ) : null}
      {creating ? (
        <FinancialMovementFormModal onClose={() => setCreating(false)} />
      ) : null}
      {selectedId !== null ? (
        <FinancialMovementDetailModal
          id={selectedId}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </section>
  );
}

function Summary({
  label,
  value,
  icon,
  state,
  stateLabel,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  state: "success" | "warning" | "neutral";
  stateLabel: string;
}) {
  return (
    <MetricCard
      label={label}
      value={value}
      icon={icon}
      state={state}
      stateLabel={stateLabel}
    />
  );
}

function formatCount(value: number) {
  return new Intl.NumberFormat("es-CR").format(value);
}
