import { useState, type FormEvent } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
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
import { adminReportsApi } from '../api/adminReports.api'
import { useAffiliateReport } from '../hooks/useAdminReportsQueries'
import type {
  AffiliateReportFilters,
  AffiliateStatus,
  SubscriptionReportStatus,
} from '../model/adminReports.types'

const PAGE_LIMIT = 20

type FilterForm = {
  search: string
  affiliateType: string
  affiliateStatus: AffiliateStatus | ''
  subscriptionStatus: SubscriptionReportStatus | ''
  dateFrom: string
  dateTo: string
}

const EMPTY_FORM: FilterForm = {
  search: '',
  affiliateType: '',
  affiliateStatus: '',
  subscriptionStatus: '',
  dateFrom: '',
  dateTo: '',
}

const subscriptionStatusLabels: Record<SubscriptionReportStatus, string> = {
  CURRENT: 'Vigente',
  EXPIRED: 'Vencida',
  UNSPECIFIED: 'Sin vencimiento registrado',
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(
    new Date(value),
  )
}

function hasFilters(filters: AffiliateReportFilters) {
  return Boolean(
    filters.search ||
      filters.affiliateType ||
      filters.affiliateStatus ||
      filters.subscriptionStatus ||
      filters.dateFrom ||
      filters.dateTo,
  )
}

export function AffiliatesReportPage() {
  const [form, setForm] = useState<FilterForm>(EMPTY_FORM)
  const [filterError, setFilterError] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [filters, setFilters] = useState<AffiliateReportFilters>({
    page: 1,
    limit: PAGE_LIMIT,
  })
  const report = useAffiliateReport(filters)
  const rows = report.data?.data.data ?? []
  const total = report.data?.data.total ?? 0

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (form.dateFrom && form.dateTo && form.dateFrom > form.dateTo) {
      setFilterError('La fecha inicial no puede ser posterior a la fecha final.')
      return
    }

    setFilterError('')
    setFilters({
      search: form.search.trim() || undefined,
      affiliateType: form.affiliateType.trim() || undefined,
      affiliateStatus: form.affiliateStatus || undefined,
      subscriptionStatus: form.subscriptionStatus || undefined,
      dateFrom: form.dateFrom
        ? new Date(`${form.dateFrom}T00:00:00`).toISOString()
        : undefined,
      dateTo: form.dateTo
        ? new Date(`${form.dateTo}T23:59:59.999`).toISOString()
        : undefined,
      page: 1,
      limit: PAGE_LIMIT,
    })
  }

  function clearFilters() {
    setForm(EMPTY_FORM)
    setFilterError('')
    setFilters({ page: 1, limit: PAGE_LIMIT })
  }

  async function exportReport() {
    setIsExporting(true)
    try {
      const blob = await adminReportsApi.exportAffiliates(filters)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Reporte_Afiliados_Membresias_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (error) {
      toast.error(
        getErrorMessage(error, 'No fue posible exportar el reporte de afiliados.'),
      )
    } finally {
      setIsExporting(false)
    }
  }

  const activeFilters = hasFilters(filters)

  return (
    <section className="space-y-6">
      <PageHeader
        context="Información"
        title="Reporte de afiliados"
        description="Consulte la afiliación y la vigencia de suscripción registrada. La vigencia se determina con la fecha de vencimiento y la regla actual de acceso; el estado del afiliado se presenta por separado."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => void exportReport()}
            loading={isExporting}
          >
            <Download aria-hidden="true" />
            {isExporting ? 'Exportando CSV...' : 'Exportar CSV'}
          </Button>
        }
      />

      <form
        className="grid gap-4 rounded-surface border border-border-default bg-surface-card p-4 sm:grid-cols-2 lg:grid-cols-6"
        onSubmit={applyFilters}
        aria-label="Filtros del reporte de afiliados"
      >
        <label className="flex min-w-0 flex-col gap-1 text-label font-medium text-text-primary sm:col-span-2">
          Nombre o identificación
          <Input
            type="search"
            value={form.search}
            onChange={(event) =>
              setForm({ ...form, search: event.target.value })
            }
            placeholder="Buscar afiliado"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-label font-medium text-text-primary">
          Tipo de afiliado
          <Input
            value={form.affiliateType}
            onChange={(event) =>
              setForm({ ...form, affiliateType: event.target.value })
            }
            placeholder="Tipo registrado"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-label font-medium text-text-primary">
          Estado del afiliado
          <Select
            value={form.affiliateStatus}
            onChange={(event) =>
              setForm({
                ...form,
                affiliateStatus: event.target.value as AffiliateStatus | '',
              })
            }
          >
            <option value="">Todos</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </Select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-label font-medium text-text-primary">
          Vigencia
          <Select
            value={form.subscriptionStatus}
            onChange={(event) =>
              setForm({
                ...form,
                subscriptionStatus: event.target
                  .value as SubscriptionReportStatus | '',
              })
            }
          >
            <option value="">Todas</option>
            <option value="CURRENT">Vigente</option>
            <option value="EXPIRED">Vencida</option>
            <option value="UNSPECIFIED">Sin vencimiento registrado</option>
          </Select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-label font-medium text-text-primary">
          Afiliación desde
          <Input
            type="date"
            value={form.dateFrom}
            onChange={(event) =>
              setForm({ ...form, dateFrom: event.target.value })
            }
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-label font-medium text-text-primary">
          Afiliación hasta
          <Input
            type="date"
            value={form.dateTo}
            onChange={(event) =>
              setForm({ ...form, dateTo: event.target.value })
            }
          />
        </label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-6">
          <Button type="submit">Aplicar filtros</Button>
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            disabled={!activeFilters && !Object.values(form).some(Boolean)}
          >
            Limpiar
          </Button>
        </div>
        {filterError ? (
          <p className="text-body-small text-destructive sm:col-span-2 lg:col-span-6" role="alert">
            {filterError}
          </p>
        ) : null}
      </form>

      {report.isPending ? (
        <LoadingState label="Cargando reporte de afiliados..." />
      ) : report.isError ? (
        <ErrorState
          message={getErrorMessage(
            report.error,
            'No fue posible cargar el reporte de afiliados.',
          )}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void report.refetch()}
            >
              Reintentar
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No hay afiliados para mostrar"
          description="No se encontraron resultados con los filtros seleccionados."
          action={
            activeFilters ? (
              <Button type="button" variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div
            className="overflow-x-auto rounded-surface border border-border-default"
            tabIndex={0}
            aria-label="Tabla de reporte de afiliados, desplazable horizontalmente"
          >
            <table className="min-w-[920px] w-full text-left text-body-small">
              <caption className="sr-only">
                Afiliados, estado y vigencia de suscripción
              </caption>
              <thead className="bg-surface-muted text-text-secondary">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Afiliado</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Identificación</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Tipo de afiliado</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Vigencia</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Afiliación</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Vencimiento</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Días restantes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default bg-surface-card text-text-primary">
                {rows.map((affiliate) => (
                  <tr key={affiliate.id}>
                    <td className="px-4 py-3 font-medium">{affiliate.fullName}</td>
                    <td className="px-4 py-3 tabular-nums">{affiliate.identification}</td>
                    <td className="px-4 py-3">{affiliate.affiliateType ?? 'Sin especificar'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={affiliate.affiliateStatus === 'ACTIVE' ? 'success' : 'neutral'}>
                        {affiliate.affiliateStatus === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        variant={
                          affiliate.subscriptionStatus === 'CURRENT'
                            ? 'success'
                            : affiliate.subscriptionStatus === 'EXPIRED'
                              ? 'danger'
                              : 'neutral'
                        }
                      >
                        {subscriptionStatusLabels[affiliate.subscriptionStatus]}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">{formatDate(affiliate.affiliationDate)}</td>
                    <td className="px-4 py-3">{formatDate(affiliate.subscriptionExpirationDate)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {affiliate.daysRemaining === null ? '—' : affiliate.daysRemaining}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={filters.page}
            total={total}
            limit={filters.limit}
            onChange={(page) => setFilters({ ...filters, page })}
            label="Paginación del reporte de afiliados"
          />
        </>
      )}
    </section>
  )
}
