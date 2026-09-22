import { Building2, CalendarDays, FileText, Landmark, Pencil, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { MetricCard } from '@/shared/ui/MetricCard'
import { PageHeader } from '@/shared/ui/PageHeader'
import { useDinadecoAnnualReport } from '../hooks/useFinancial'
import type { DinadecoFieLine, DinadecoInstitutionalProfile, FinancialMovementSource } from '../model/financial.types'
import { financialMovementSourceLabel, formatFinancialCurrency, formatFinancialDate } from './financialPresentation'

const currentYear = new Date().getFullYear()
const availableYears = Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index)

export function DinadecoAnnualReportPage() {
  const { user } = useAuth()
  const [year, setYear] = useState(currentYear)
  const report = useDinadecoAnnualReport(year)
  const mayEditInstitutionalProfile = hasCapability(user?.role, 'adm.institutional-profile.read')

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
      {report.data && <ReportContent report={report.data} mayEditInstitutionalProfile={mayEditInstitutionalProfile} />}
    </div>
  )
}

function ReportContent({ report, mayEditInstitutionalProfile }: { report: NonNullable<ReturnType<typeof useDinadecoAnnualReport>['data']>; mayEditInstitutionalProfile: boolean }) {
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

      <InstitutionalProfileCard profile={data.institutionalProfile} mayEdit={mayEditInstitutionalProfile} />

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

      <section aria-labelledby="fie-preparation-title" className="space-y-5">
        <h2 id="fie-preparation-title">Preparación del FIE</h2>
        <Card>
          <CardHeader><CardTitle>Resumen FIE</CardTitle><CardDescription>Datos para completar el FIE a partir del historial registrado.</CardDescription></CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Saldo inicial derivado', data.openingBalance],
                ['Total entradas', data.income.total],
                ['Total entradas + saldo inicial', data.fie.totalIncomePlusOpeningBalance],
                ['Total salidas', data.expenses.total],
                ['Saldo final derivado', data.closingBalance],
                ['Total salidas + saldo final', data.fie.totalExpensesPlusClosingBalance],
              ].map(([label, value]) => <div key={label}><dt className="text-sm text-foreground-muted">{label}</dt><dd className="font-semibold tabular-nums">{formatFinancialCurrency(value)}</dd></div>)}
            </dl>
          </CardContent>
        </Card>
        <p className="text-sm text-foreground-muted">El formulario FIE dispone de 15 espacios para entradas y 15 para salidas. SGI-Curime no consolida ni omite movimientos automáticamente.</p>
        <FieMovements title="Entradas" lines={data.fie.entries} count={data.fie.capacity.entryCount} capacity={data.fie.capacity.entryCapacity} overflow={data.fie.capacity.entryOverflow} direction="entrada" />
        <FieMovements title="Salidas" lines={data.fie.exits} count={data.fie.capacity.exitCount} capacity={data.fie.capacity.exitCapacity} overflow={data.fie.capacity.exitOverflow} direction="salida" />
      </section>

      <Card>
        <CardHeader><CardTitle>Documentación complementaria</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground-muted">
          <p>El saldo inicial y el saldo final son derivados del historial disponible en SGI-Curime. No existe conciliación bancaria en este incremento ni se distingue automáticamente caja física de cuentas bancarias; estos valores no son saldos oficiales conciliados.</p>
          <p>Los datos institucionales mostrados provienen del Perfil institucional. Los campos marcados como “Pendiente de cargar” aún requieren captura o validación por la Asociación.</p>
          <p>La presidencia y tesorería legal, las firmas, el sello, los anexos bancarios y la recepción por DINADECO continúan fuera del alcance de esta preparación.</p>
          <p>El Informe Económico presentado a DINADECO requiere documentación de respaldo, incluido el estado de cuenta bancario correspondiente al cierre anual y, cuando aplique, estados financieros adicionales.</p>
          <p>Esta vista agrupa los movimientos registrados en SGI-Curime por su fuente operativa. Es una base para preparar el informe; todavía no clasifica cuentas, folios ni un catálogo contable DINADECO, y no genera el formulario oficial.</p>
        </CardContent>
      </Card>
    </>
  )
}

function InstitutionalProfileCard({ profile, mayEdit }: { profile: DinadecoInstitutionalProfile; mayEdit: boolean }) {
  const fields = [
    ['Nombre legal', profile.legalName],
    ['Cédula jurídica', profile.legalIdentification],
    ['Registro DINADECO', profile.dinadecoRegistrationCode],
    ['Región', profile.dinadecoRegion],
    ['Tipo', organizationTypeLabel(profile.organizationType)],
    ['Provincia', profile.province],
    ['Cantón', profile.canton],
    ['Distrito', profile.district],
    ['Localidad', profile.locality],
    ['Dirección de correspondencia', profile.correspondenceAddress],
    ['Teléfono', profile.phone],
    ['Telefax', profile.telefax],
    ['Correo institucional', profile.email],
  ] as const

  return (
    <section aria-labelledby="institutional-profile-title">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle><h2 id="institutional-profile-title" className="flex items-center gap-2"><Building2 aria-hidden="true" />Información institucional</h2></CardTitle>
            <CardDescription>Identidad de la Asociación utilizada para preparar el reporte DINADECO.</CardDescription>
          </div>
          {mayEdit && <Button nativeButton={false} render={<Link to="/app/admin/institutional-profile" />} variant="outline" size="sm"><Pencil aria-hidden="true" />Editar perfil institucional</Button>}
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(([label, value]) => <InstitutionalDatum key={label} label={label} value={value} />)}
          </dl>
        </CardContent>
      </Card>
    </section>
  )
}

function InstitutionalDatum({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-sm text-foreground-muted">{label}</dt><dd className="mt-1 font-semibold text-text-primary">{value ?? 'Pendiente de cargar'}</dd></div>
}

function organizationTypeLabel(value: DinadecoInstitutionalProfile['organizationType']) {
  if (value === 'INTEGRAL') return 'Integral'
  if (value === 'SPECIFIC') return 'Específica'
  return null
}

function FieMovements({ title, lines, count, capacity, overflow, direction }: { title: string; lines: DinadecoFieLine[]; count: number; capacity: number; overflow: boolean; direction: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{count} de {capacity} movimientos de {direction}</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {overflow && <p role="alert" className="text-sm font-semibold text-status-warning">El formulario oficial no tiene espacio suficiente para representar individualmente todos los movimientos de {direction}. Se conserva el detalle completo; la estrategia de consolidación requiere validación con la ADI.</p>}
        {lines.length === 0 ? <p className="text-sm text-foreground-muted">No se registraron movimientos de {direction} en el período.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Detalle de {title.toLowerCase()} para preparar el FIE</caption>
              <thead><tr>{['Fecha', 'Descripción', 'Fuente', 'Monto'].map((label) => <th key={label} scope="col" className="p-3 text-left">{label}</th>)}</tr></thead>
              <tbody>{lines.map((line) => <tr key={line.id} className="border-t border-border-default"><td className="p-3 whitespace-nowrap">{formatFinancialDate(line.occurredAt)}</td><td className="p-3 break-words">{line.description}</td><td className="p-3">{financialMovementSourceLabel(line.source)}</td><td className="p-3 text-right whitespace-nowrap tabular-nums">{formatFinancialCurrency(line.amount)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
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
