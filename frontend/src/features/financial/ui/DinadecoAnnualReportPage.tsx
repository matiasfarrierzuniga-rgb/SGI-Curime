import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '@/shared/ui/DataTable'
import { Building2, CalendarDays, ClipboardList, FileText, Landmark, Pencil, ShieldCheck, TriangleAlert, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { useDinadecoAnnualReport } from '../hooks/useFinancial'
import { FinancialSectionNav } from './FinancialSectionNav'
import type { DinadecoFieLine, DinadecoInstitutionalProfile, FinancialMovementSource } from '../model/financial.types'
import { financialMovementSourceLabel, formatFinancialCurrency, formatFinancialDate } from './financialPresentation'

const currentYear = new Date().getFullYear()
const availableYears = Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index)

export function DinadecoAnnualReportPage() {
  const { user } = useAuth()
  const [year, setYear] = useState(currentYear)
  const report = useDinadecoAnnualReport(year)
  const mayEditInstitutionalProfile = hasCapability(user?.permissionCodes, 'adm.institutional-profile.read') && hasCapability(user?.permissionCodes, 'adm.institutional-profile.update')

  return (
    <div className="space-y-7">
      <PageHeader
        context="Gestión financiera · Informe anual institucional"
        title="Informe Económico DINADECO"
        description="Resumen anual de movimientos financieros para apoyar la preparación del Informe Económico de la asociación."
        actions={
          <label className="grid min-w-36 gap-1 text-sm font-semibold" htmlFor="dinadeco-year">
            Año
            <select className="min-h-11 rounded-control border border-border-default bg-control px-3 font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" id="dinadeco-year" value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {availableYears.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        }
      />
      <FinancialSectionNav />
      <aside aria-label="Alcance del informe DINADECO" className="flex gap-3 rounded-surface border border-status-info-border bg-status-info-surface p-4 text-sm text-status-info-foreground">
        <FileText aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p><strong>Vista de preparación y consulta.</strong> Este resumen no genera el formulario oficial ni realiza envío o presentación ante DINADECO.</p>
      </aside>

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
      <section aria-labelledby="dinadeco-summary-title" className="overflow-hidden rounded-surface border border-brand-primary/25 bg-surface-card shadow-surface">
        <div className="flex flex-wrap items-start justify-between gap-4 bg-brand-primary px-5 py-5 text-primary-foreground sm:px-6"><div><p className="text-caption font-bold uppercase tracking-[0.14em] text-brand-sage">Expediente económico anual · {data.year}</p><h2 id="dinadeco-summary-title" className="mt-1 text-heading-2 font-bold">Resumen económico registrado</h2><p className="mt-2 max-w-2xl text-sm text-primary-foreground/80">Documento de trabajo para revisar movimientos y preparar el Informe Económico DINADECO.</p></div><div className="flex items-center gap-2 rounded-control border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold"><ShieldCheck className="size-4" aria-hidden="true" />{data.movementCount} movimientos</div></div>
        <dl className="grid divide-y divide-border-default sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          <EconomicDatum icon={<Wallet />} label="Saldo anterior" value={formatFinancialCurrency(data.openingBalance)} note="Derivado del historial previo" />
          <EconomicDatum icon={<TrendingUp />} label="Entradas" value={formatFinancialCurrency(data.income.total)} note={`${data.income.count} movimientos`} tone="success" />
          <EconomicDatum icon={<TrendingDown />} label="Salidas" value={formatFinancialCurrency(data.expenses.total)} note={`${data.expenses.count} movimientos`} tone="warning" />
          <EconomicDatum icon={<Landmark />} label="Saldo final" value={formatFinancialCurrency(data.closingBalance)} note="Derivado; no conciliado" />
        </dl>
        <dl className="grid gap-4 border-t border-border-default bg-surface-muted/55 px-5 py-4 text-sm sm:grid-cols-3 sm:px-6">
          <ReportDatum icon={<CalendarDays />} label="Período" value={`${formatPeriodDate(metadata.period.from)} – ${formatPeriodEnd(metadata.period.to)}`} />
          <ReportDatum icon={<FileText />} label="Generado" value={formatFinancialDate(metadata.generatedAt)} />
          <ReportDatum icon={<Wallet />} label="Responsable de consulta" value={metadata.generatedBy?.fullName ?? 'Usuario no disponible'} />
        </dl>
      </section>

      <section aria-labelledby="source-summary-title"><DocumentSectionHeading number="01" title="Composición del período" description="Desglose por fuente operativa registrada; no corresponde a cuentas contables DINADECO." id="source-summary-title" /><div className="mt-4 grid gap-5 lg:grid-cols-2">
        <SourceBreakdown title="Entradas del período" sources={data.income.bySource} />
        <SourceBreakdown title="Salidas del período" sources={data.expenses.bySource} />
      </div></section>

      <InstitutionalProfileCard profile={data.institutionalProfile} mayEdit={mayEditInstitutionalProfile} />

      <section aria-labelledby="fie-preparation-title" className="space-y-5">
        <DocumentSectionHeading number="03" title="Preparación del FIE" description="Valores y movimientos disponibles para transcribir y revisar en el formulario correspondiente." id="fie-preparation-title" />
        <Card className="border-brand-primary/20">
          <CardHeader className="border-b border-border-default bg-brand-primary/[0.05]"><CardTitle><span className="flex items-center gap-2"><ClipboardList className="size-5 text-brand-primary" aria-hidden="true" />Resumen FIE</span></CardTitle><CardDescription>Comprobación aritmética derivada del historial registrado.</CardDescription></CardHeader>
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
        <p className="rounded-control border border-status-info-border bg-status-info-surface p-3 text-sm text-status-info-foreground">El formulario FIE dispone de 15 espacios para entradas y 15 para salidas. SGI-Curime conserva el detalle y no consolida ni omite movimientos automáticamente.</p>
        <div className="grid min-w-0 gap-5 xl:grid-cols-2"><FieMovements title="Entradas" lines={data.fie.entries} count={data.fie.capacity.entryCount} capacity={data.fie.capacity.entryCapacity} overflow={data.fie.capacity.entryOverflow} direction="entrada" /><FieMovements title="Salidas" lines={data.fie.exits} count={data.fie.capacity.exitCount} capacity={data.fie.capacity.exitCapacity} overflow={data.fie.capacity.exitOverflow} direction="salida" /></div>
      </section>

      <Card className="border-[#e7c477] bg-[#fff8df]">
        <CardHeader className="border-b border-[#e7c477]"><CardTitle><span className="flex items-center gap-2"><TriangleAlert className="size-5 text-brand-ink" aria-hidden="true" />Documentación complementaria y límites</span></CardTitle><CardDescription>Verificaciones requeridas antes de preparar o presentar documentación oficial.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 text-sm text-foreground-muted lg:grid-cols-2">
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
      <DocumentSectionHeading number="02" title="Información institucional" description="Identidad oficial disponible en el Perfil institucional de la Asociación." id="institutional-profile-title" />
      <Card className="mt-4 border-brand-primary/20">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border-default bg-brand-primary/[0.05]">
          <div>
            <CardTitle><span className="flex items-center gap-2"><Building2 className="size-5 text-brand-primary" aria-hidden="true" />Perfil utilizado en este expediente</span></CardTitle>
            <CardDescription>Campos pendientes requieren captura o validación institucional.</CardDescription>
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
    <Card className="min-w-0">
      <CardHeader className="border-b border-border-default"><CardTitle>{title}</CardTitle><CardDescription>{count} de {capacity} movimientos de {direction}</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {overflow && <p role="alert" className="text-sm font-semibold text-status-warning">El formulario oficial no tiene espacio suficiente para representar individualmente todos los movimientos de {direction}. Se conserva el detalle completo; la estrategia de consolidación requiere validación con la ADI.</p>}
        {lines.length === 0 ? <p className="text-sm text-foreground-muted">No se registraron movimientos de {direction} en el período.</p> : (
          <div className="overflow-x-auto" tabIndex={0} aria-label={`Detalle de ${title.toLowerCase()} para preparar el FIE`}>
            <DataTable className="w-full min-w-[34rem] text-sm">
              <caption className="sr-only">Detalle de {title.toLowerCase()} para preparar el FIE</caption>
              <DataTableHeader><DataTableRow>{['Fecha', 'Descripción', 'Fuente', 'Monto'].map((label) => <DataTableHead key={label} scope="col" className="p-3 text-left">{label}</DataTableHead>)}</DataTableRow></DataTableHeader>
              <DataTableBody>{lines.map((line) => <DataTableRow key={line.id} className="border-t border-border-default"><DataTableCell className="p-3 whitespace-nowrap">{formatFinancialDate(line.occurredAt)}</DataTableCell><DataTableCell className="p-3 break-words">{line.description}</DataTableCell><DataTableCell className="p-3">{financialMovementSourceLabel(line.source)}</DataTableCell><DataTableCell className="p-3 text-right whitespace-nowrap tabular-nums">{formatFinancialCurrency(line.amount)}</DataTableCell></DataTableRow>)}</DataTableBody>
            </DataTable>
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

function EconomicDatum({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note: string; tone?: 'success' | 'warning' }) {
  const iconClass = tone === 'success' ? 'bg-status-success-surface text-status-success' : tone === 'warning' ? 'bg-[#fff0c9] text-brand-ink' : 'bg-brand-primary/10 text-brand-primary'
  return <div className="flex gap-3 p-5"><span className={`grid size-10 shrink-0 place-items-center rounded-control ${iconClass}`} aria-hidden="true">{icon}</span><div><dt className="text-sm text-text-secondary">{label}</dt><dd className="mt-1 text-heading-3 font-bold tabular-nums text-text-primary">{value}</dd><p className="mt-1 text-xs text-text-muted">{note}</p></div></div>
}

function DocumentSectionHeading({ number, title, description, id }: { number: string; title: string; description: string; id: string }) {
  return <div className="flex items-start gap-3 border-b border-border-default pb-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-primary text-xs font-bold text-primary-foreground" aria-hidden="true">{number}</span><div><h2 className="text-heading-3 font-semibold text-text-primary" id={id}>{title}</h2><p className="mt-1 text-sm text-text-secondary">{description}</p></div></div>
}

function formatPeriodDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value))
}

function formatPeriodEnd(value: string) {
  const end = new Date(value)
  end.setUTCDate(end.getUTCDate() - 1)
  return formatPeriodDate(end.toISOString())
}
