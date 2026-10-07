import { useState, type FormEvent } from 'react'
import { useAssemblies, type AssembliesFilters, type AssemblyStatus, type AssemblyType } from '@/features/assemblies'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { Select } from '@/shared/ui/select'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useAttendanceSummary } from '../hooks/useAdminReportsQueries'

const PAGE_LIMIT = 20

type FilterForm = {
  search: string
  status: AssemblyStatus | ''
  type: AssemblyType | ''
  dateFrom: string
  dateTo: string
}

const EMPTY_FORM: FilterForm = {
  search: '',
  status: '',
  type: '',
  dateFrom: '',
  dateTo: '',
}

const statusLabels: Record<AssemblyStatus, string> = {
  SCHEDULED: 'Programada',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Finalizada',
  CANCELLED: 'Cancelada',
}

const typeLabels: Record<AssemblyType, string> = {
  ORDINARY: 'Ordinaria',
  EXTRAORDINARY: 'Extraordinaria',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function dateBoundary(value: string, endOfDay = false) {
  if (!value) return undefined
  return new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`).toISOString()
}

function isAssemblyType(value: string): value is AssemblyType {
  return value === 'ORDINARY' || value === 'EXTRAORDINARY'
}

function attendanceFilters(filters: AssembliesFilters) {
  return {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  }
}

export function AssembliesReportPanel() {
  const [form, setForm] = useState<FilterForm>(EMPTY_FORM)
  const [filterError, setFilterError] = useState('')
  const [filters, setFilters] = useState<AssembliesFilters>({
    page: 1,
    limit: PAGE_LIMIT,
  })
  const report = useAssemblies(filters)
  const attendance = useAttendanceSummary(attendanceFilters(filters))
  const rows = report.data?.data ?? []
  const attendanceByAssembly = new Map(
    attendance.data?.data.data.map((item) => [item.id, item]) ?? [],
  )

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (form.dateFrom && form.dateTo && form.dateFrom > form.dateTo) {
      setFilterError('La fecha inicial no puede ser posterior a la fecha final.')
      return
    }
    setFilterError('')
    setFilters({
      search: form.search.trim() || undefined,
      status: form.status || undefined,
      type: form.type || undefined,
      dateFrom: dateBoundary(form.dateFrom),
      dateTo: dateBoundary(form.dateTo, true),
      page: 1,
      limit: PAGE_LIMIT,
    })
  }

  function clearFilters() {
    setForm(EMPTY_FORM)
    setFilterError('')
    setFilters({ page: 1, limit: PAGE_LIMIT })
  }

  const hasFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.type ||
      filters.dateFrom ||
      filters.dateTo,
  )

  return (
    <section className="space-y-6">
      <PageHeader
        context="Reportes y estadísticas"
        title="Reporte de asambleas"
        description="Consulte las asambleas registradas, las convocatorias y la asistencia disponible."
      />

      {report.isSuccess && report.data.byStatus.length > 0 ? (
        <div className="grid gap-5">
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-surface border border-border-default bg-surface-card p-4">
              <dt className="text-body-small text-text-secondary">
                Asambleas según filtros
              </dt>
              <dd className="mt-1 text-heading-3 font-semibold tabular-nums text-text-primary">
                {report.data.total}
              </dd>
            </div>
            {report.data.byStatus.map(({ status, count }) => (
              <div
                key={status}
                className="rounded-surface border border-border-default bg-surface-card p-4"
              >
                <dt className="text-body-small text-text-secondary">
                  {statusLabels[status]}
                </dt>
                <dd className="mt-1 text-heading-3 font-semibold tabular-nums text-text-primary">
                  {count}
                </dd>
              </div>
            ))}
          </dl>
          {report.data.byType.length > 0 ? (
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {report.data.byType.map(({ type, count }) => (
                <div
                  key={type ?? 'null-type'}
                  className="rounded-surface border border-border-default bg-surface-card p-4"
                >
                  <dt className="text-body-small text-text-secondary">
                    {type && isAssemblyType(type)
                      ? typeLabels[type]
                      : type ?? 'Tipo no registrado'}
                  </dt>
                  <dd className="mt-1 text-heading-3 font-semibold tabular-nums text-text-primary">
                    {count}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}

      <form
        className="grid gap-4 rounded-surface border border-border-default bg-surface-card p-4 sm:grid-cols-2 xl:grid-cols-6"
        onSubmit={applyFilters}
        aria-label="Filtros del reporte de asambleas"
      >
        <label className="grid min-w-0 gap-1.5 text-label font-semibold text-text-primary sm:col-span-2">
          Buscar título o lugar
          <Input
            type="search"
            value={form.search}
            onChange={(event) => setForm({ ...form, search: event.target.value })}
            placeholder="Buscar asamblea"
          />
        </label>
        <label className="grid min-w-0 gap-1.5 text-label font-semibold text-text-primary">
          Estado
          <Select
            value={form.status}
            onChange={(event) =>
              setForm({
                ...form,
                status: event.target.value as AssemblyStatus | '',
              })
            }
          >
            <option value="">Todos</option>
            <option value="SCHEDULED">Programada</option>
            <option value="IN_PROGRESS">En curso</option>
            <option value="COMPLETED">Finalizada</option>
            <option value="CANCELLED">Cancelada</option>
          </Select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-label font-semibold text-text-primary">
          Tipo
          <Select
            value={form.type}
            onChange={(event) =>
              setForm({ ...form, type: event.target.value as AssemblyType | '' })
            }
          >
            <option value="">Todos</option>
            <option value="ORDINARY">Ordinaria</option>
            <option value="EXTRAORDINARY">Extraordinaria</option>
          </Select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-label font-semibold text-text-primary">
          Fecha desde
          <Input
            type="date"
            value={form.dateFrom}
            onChange={(event) => setForm({ ...form, dateFrom: event.target.value })}
          />
        </label>
        <label className="grid min-w-0 gap-1.5 text-label font-semibold text-text-primary">
          Fecha hasta
          <Input
            type="date"
            value={form.dateTo}
            onChange={(event) => setForm({ ...form, dateTo: event.target.value })}
          />
        </label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 xl:col-span-6">
          <Button type="submit">Aplicar filtros</Button>
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            disabled={!hasFilters && !Object.values(form).some(Boolean)}
          >
            Limpiar
          </Button>
        </div>
        {filterError ? (
          <p className="text-body-small text-destructive sm:col-span-2 xl:col-span-6" role="alert">
            {filterError}
          </p>
        ) : null}
      </form>

      {report.isPending ? (
        <LoadingState label="Cargando reporte de asambleas..." />
      ) : report.isError ? (
        <ErrorState
          message={getErrorMessage(report.error, 'No fue posible cargar el reporte de asambleas.')}
          action={
            <Button type="button" variant="outline" onClick={() => void report.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No hay asambleas para mostrar"
          description="No se encontraron resultados con los filtros seleccionados."
          action={hasFilters ? (
            <Button type="button" variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          <div
            className="overflow-x-auto rounded-surface border border-border-default"
            tabIndex={0}
            aria-label="Tabla de reporte de asambleas, desplazable horizontalmente"
          >
            <table className="min-w-[1180px] w-full text-left text-body-small">
              <caption className="sr-only">
                Asambleas, convocatorias y asistencia registrada
              </caption>
              <thead className="bg-surface-muted text-text-secondary">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">ID</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Asamblea</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Tipo</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Lugar</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Convocados</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Presentes</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Ausentes</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Justificadas</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Asistencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default bg-surface-card text-text-primary">
                {rows.map((assembly) => {
                  const attendanceRow = attendanceByAssembly.get(assembly.id)
                  return (
                    <tr key={assembly.id}>
                      <td className="px-4 py-3 tabular-nums">{assembly.id}</td>
                      <td className="px-4 py-3 font-medium">{assembly.title}</td>
                      <td className="px-4 py-3">
                        {assembly.type && isAssemblyType(assembly.type)
                          ? typeLabels[assembly.type]
                          : assembly.type ?? 'Sin especificar'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={assembly.status === 'COMPLETED' ? 'success' : assembly.status === 'CANCELLED' ? 'danger' : assembly.status === 'IN_PROGRESS' ? 'warning' : 'neutral'}>
                          {statusLabels[assembly.status]}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(assembly.date)}</td>
                      <td className="px-4 py-3">{assembly.place}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {assembly._count?.convocations ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {attendanceRow?.present ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {attendanceRow?.absent ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {attendanceRow?.justified ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {attendanceRow?.attendancePercentage === null ||
                        attendanceRow?.attendancePercentage === undefined
                          ? '—'
                          : `${attendanceRow.attendancePercentage}%`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={report.data.page}
            total={report.data.total}
            limit={report.data.limit}
            onChange={(page) => setFilters({ ...filters, page })}
            label="Paginación del reporte de asambleas"
          />
        </>
      )}

      {attendance.isError ? (
        <ErrorState
          title="No fue posible cargar los datos de asistencia"
          message={getErrorMessage(attendance.error)}
          action={
            <Button type="button" variant="outline" onClick={() => void attendance.refetch()}>
              Reintentar asistencia
            </Button>
          }
        />
      ) : null}
      {attendance.isPending ? (
        <p className="text-body-small text-text-secondary" role="status">
          Cargando datos de asistencia...
        </p>
      ) : null}
    </section>
  )
}
