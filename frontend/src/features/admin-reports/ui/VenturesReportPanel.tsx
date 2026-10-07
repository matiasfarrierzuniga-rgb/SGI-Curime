import { useState, type FormEvent } from 'react'
import { useVentures, type VentureStatus, type VenturePublicationStatus, type VenturesFilters } from '@/features/entrepreneurship'
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

const PAGE_LIMIT = 20

type FilterForm = {
  search: string
  status: VentureStatus | ''
  publicationStatus: VenturePublicationStatus | ''
  location: string
  dateFrom: string
  dateTo: string
}

const EMPTY_FORM: FilterForm = {
  search: '',
  status: '',
  publicationStatus: '',
  location: '',
  dateFrom: '',
  dateTo: '',
}

const statusLabels: Record<VentureStatus, string> = {
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  CLOSED: 'Cerrado',
}

const publicationLabels: Record<VenturePublicationStatus, string> = {
  UNPUBLISHED: 'No publicado',
  PUBLISHED: 'Publicado',
}

const statusVariant = (status: VentureStatus) =>
  status === 'ACTIVE' ? 'success' : status === 'SUSPENDED' ? 'warning' : 'danger'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(
    new Date(value),
  )
}

function dateBoundary(value: string, endOfDay = false) {
  if (!value) return undefined
  return new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`).toISOString()
}

function fullName(person: {
  firstName: string
  firstSurname: string
  secondSurname: string | null
}) {
  return [person.firstName, person.firstSurname, person.secondSurname]
    .filter(Boolean)
    .join(' ')
}

export function VenturesReportPanel() {
  const [form, setForm] = useState<FilterForm>(EMPTY_FORM)
  const [filterError, setFilterError] = useState('')
  const [filters, setFilters] = useState<VenturesFilters>({
    page: 1,
    limit: PAGE_LIMIT,
  })
  const report = useVentures(filters)
  const rows = report.data?.data ?? []

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
      publicationStatus: form.publicationStatus || undefined,
      location: form.location.trim() || undefined,
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
      filters.publicationStatus ||
      filters.location ||
      filters.dateFrom ||
      filters.dateTo,
  )

  return (
    <section className="space-y-6">
      <PageHeader
        context="Reportes y estadísticas"
        title="Reporte de emprendimientos"
        description="Consulte emprendimientos, estados, ubicación, incorporación y personas asociadas registradas."
      />

      {report.isSuccess ? (
        <>
        <section aria-label="Resumen por estado de emprendimiento">
          <h2 className="mb-3 text-heading-3 font-semibold text-text-primary">
            Distribución por estado
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-surface border border-border-default bg-surface-card p-4">
              <dt className="text-body-small text-text-secondary">
                Emprendimientos en los filtros
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
        </section>
        <section aria-label="Distribución de emprendimientos por ubicación">
          <h2 className="mb-3 text-heading-3 font-semibold text-text-primary">
            Distribución por ubicación
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {report.data.byLocation.map(({ location, count }) => (
              <div
                key={location ?? 'null-location'}
                className="rounded-surface border border-border-default bg-surface-card p-4"
              >
                <dt className="text-body-small text-text-secondary">
                  {location ?? 'Sin ubicación registrada'}
                </dt>
                <dd className="mt-1 text-heading-3 font-semibold tabular-nums text-text-primary">
                  {count}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        </>
      ) : null}

      <form
        className="grid gap-4 rounded-surface border border-border-default bg-surface-card p-4 sm:grid-cols-2 xl:grid-cols-6"
        onSubmit={applyFilters}
        aria-label="Filtros del reporte de emprendimientos"
      >
        <label className="grid min-w-0 gap-1.5 text-label font-semibold text-text-primary sm:col-span-2">
          Buscar emprendimiento, descripción o persona asociada
          <Input
            type="search"
            value={form.search}
            onChange={(event) => setForm({ ...form, search: event.target.value })}
            placeholder="Buscar emprendimiento o persona"
          />
        </label>
        <label className="grid min-w-0 gap-1.5 text-label font-semibold text-text-primary">
          Estado
          <Select
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value as VentureStatus | '' })
            }
          >
            <option value="">Todos</option>
            <option value="ACTIVE">Activo</option>
            <option value="SUSPENDED">Suspendido</option>
            <option value="CLOSED">Cerrado</option>
          </Select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-label font-semibold text-text-primary">
          Publicación
          <Select
            value={form.publicationStatus}
            onChange={(event) =>
              setForm({
                ...form,
                publicationStatus: event.target.value as VenturePublicationStatus | '',
              })
            }
          >
            <option value="">Todas</option>
            <option value="UNPUBLISHED">No publicado</option>
            <option value="PUBLISHED">Publicado</option>
          </Select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-label font-semibold text-text-primary">
          Ubicación
          <Input
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
            placeholder="Filtrar ubicación"
          />
        </label>
        <label className="grid min-w-0 gap-1.5 text-label font-semibold text-text-primary">
          Incorporación desde
          <Input
            type="date"
            value={form.dateFrom}
            onChange={(event) => setForm({ ...form, dateFrom: event.target.value })}
          />
        </label>
        <label className="grid min-w-0 gap-1.5 text-label font-semibold text-text-primary">
          Incorporación hasta
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
        <LoadingState label="Cargando reporte de emprendimientos..." />
      ) : report.isError ? (
        <ErrorState
          message={getErrorMessage(report.error, 'No fue posible cargar el reporte de emprendimientos.')}
          action={
            <Button type="button" variant="outline" onClick={() => void report.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No hay emprendimientos para mostrar"
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
            aria-label="Tabla de reporte de emprendimientos, desplazable horizontalmente"
          >
            <table className="min-w-[1080px] w-full text-left text-body-small">
              <caption className="sr-only">
                Emprendimientos, estado, incorporación, ubicación y personas asociadas
              </caption>
              <thead className="bg-surface-muted text-text-secondary">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">ID</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Emprendimiento</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Publicación</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Incorporación</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Ubicación</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Personas asociadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default bg-surface-card text-text-primary">
                {rows.map((venture) => (
                  <tr key={venture.id}>
                    <td className="px-4 py-3 tabular-nums">{venture.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{venture.name}</p>
                      {venture.description ? (
                        <p className="mt-1 max-w-sm text-text-secondary">
                          {venture.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={statusVariant(venture.status)}>
                        {statusLabels[venture.status]}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={venture.publicationStatus === 'PUBLISHED' ? 'success' : 'neutral'}>
                        {publicationLabels[venture.publicationStatus]}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(venture.incorporatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {venture.locationText ?? 'Sin ubicación registrada'}
                    </td>
                    <td className="px-4 py-3">
                      {venture.associations.length > 0
                        ? venture.associations.map(({ id, person }) => (
                            <span key={id} className="mr-2 inline-block">
                              {fullName(person)}
                            </span>
                          ))
                        : 'Sin personas asociadas'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={report.data.page}
            total={report.data.total}
            limit={report.data.limit}
            onChange={(page) => setFilters({ ...filters, page })}
            label="Paginación del reporte de emprendimientos"
          />
        </>
      )}
    </section>
  )
}
