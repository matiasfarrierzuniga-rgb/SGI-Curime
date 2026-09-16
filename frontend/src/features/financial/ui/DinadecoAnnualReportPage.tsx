import { CalendarDays, FileText, Landmark, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { MetricCard } from '@/shared/ui/MetricCard'
import { PageHeader } from '@/shared/ui/PageHeader'
import { useDinadecoAnnualReport } from '../hooks/useFinancial'
import type { FinancialMovementSource } from '../model/financial.types'
import { financialMovementSourceLabel, formatFinancialCurrency, formatFinancialDate } from './financialPresentation'

const currentYear = new Date().getFullYear()
const availableYears = Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index)

export function DinadecoAnnualReportPage() {
  const [year, setYear] = useState(currentYear)
  const report = useDinadecoAnnualReport(year)

  return (
    <div className="space-y-7">
      <PageHeader
        context="Gestión financiera"
        title="Informe Económico DINADECO"
        description="Resumen anual de movimientos financieros para apoyar la preparación del Informe Económico de la asociación."
        actions={
          <label className="grid min-w-36 gap-1 text-sm font-semibold" htmlFor="dinadeco-year">
            Año
            <select id="dinadeco-year" value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {availableYears.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        }
      />

      {report.isPending && <LoadingState label={`Cargando informe económico ${year}...`} className="min-h-64" />}
      {report.isError && (
        <ErrorState
          message="Intente nuevamente para consultar los movimientos financieros del período."
          action={<Button variant="outline" onClick={() => void report.refetch()}>Reintentar</Button>}
        />
      )}
      {report.data && <ReportContent report={report.data} />}
    </div>
  )
}

function ReportContent({ report }: { report: NonNullable<ReturnType<typeof useDinadecoAnnualReport>['data']> }) {
  const { data, metadata } = report
  return (
    <>
      <section aria-labelledby="dinadeco-summary-title">
        <h2 id="dinadeco-summary-title" className="sr-only">Resumen económico anual</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Saldo anterior" value={formatFinancialCurrency(data.openingBalance)} icon={<Wallet />} supportingText="Calculado del historial registrado antes del período." />
          <MetricCard label="Entradas" value={formatFinancialCurrency(data.income.total)} icon={<TrendingUp />} state="success" stateLabel={`${data.income.count} movimientos`} />
          <MetricCard label="Salidas" value={formatFinancialCurrency(data.expenses.total)} icon={<TrendingDown />} state="warning" stateLabel={`${data.expenses.count} movimientos`} />
          <MetricCard label="Saldo final" value={formatFinancialCurrency(data.closingBalance)} icon={<Landmark />} supportingText={`${data.movementCount} movimientos en el período`} />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <SourceBreakdown title="Entradas del período" sources={data.income.bySource} />
        <SourceBreakdown title="Salidas del período" sources={data.expenses.bySource} />
      </div>

      <Card>
        <CardHeader><CardTitle>Información del reporte</CardTitle><CardDescription>Datos de generación y alcance temporal.</CardDescription></CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <ReportDatum icon={<CalendarDays />} label="Período" value={`${formatPeriodDate(metadata.period.from)} – ${formatPeriodEnd(metadata.period.to)}`} />
            <ReportDatum icon={<FileText />} label="Fecha de generación" value={formatFinancialDate(metadata.generatedAt)} />
            <ReportDatum icon={<Wallet />} label="Generado por" value={metadata.generatedBy?.fullName ?? 'Usuario no disponible'} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Documentación complementaria</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground-muted">
          <p>El Informe Económico presentado a DINADECO requiere documentación de respaldo, incluido el estado de cuenta bancario correspondiente al cierre anual y, cuando aplique, estados financieros adicionales.</p>
          <p>Esta vista agrupa los movimientos registrados en SGI-Curime por su fuente operativa. Es una base para preparar el informe; todavía no clasifica cuentas, folios ni un catálogo contable DINADECO, y no genera el formulario oficial.</p>
        </CardContent>
      </Card>
    </>
  )
}

function SourceBreakdown({ title, sources }: { title: string; sources: Partial<Record<FinancialMovementSource, { total: string; count: number }>> }) {
  const entries = Object.entries(sources) as Array<[FinancialMovementSource, { total: string; count: number }]>
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>Desglose por fuente del movimiento, no por cuenta contable.</CardDescription></CardHeader>
      <CardContent>
        {entries.length === 0 ? <p className="text-sm text-foreground-muted">No se registraron movimientos en esta categoría.</p> : (
          <ul className="divide-y divide-border-default">
            {entries.map(([source, summary]) => (
              <li key={source} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div><p className="font-semibold text-text-primary">{financialMovementSourceLabel(source)}</p><p className="text-xs text-text-muted">{summary.count} {summary.count === 1 ? 'movimiento' : 'movimientos'}</p></div>
                <span className="font-semibold tabular-nums">{formatFinancialCurrency(summary.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ReportDatum({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex gap-3"><span className="mt-0.5 text-brand-primary" aria-hidden="true">{icon}</span><div><dt className="font-semibold text-text-primary">{label}</dt><dd className="mt-1 text-text-secondary">{value}</dd></div></div>
}

function formatPeriodDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value))
}

function formatPeriodEnd(value: string) {
  const end = new Date(value)
  end.setUTCDate(end.getUTCDate() - 1)
  return formatPeriodDate(end.toISOString())
}
