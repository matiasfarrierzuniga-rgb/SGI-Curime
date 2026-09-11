import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { useMineAssemblies } from '../hooks/useAssembliesQueries'
import type { MineAssembly } from '../model/assemblies.types'

function personalStatus(item: MineAssembly) {
  const { assembly } = item
  if (assembly.status === 'SCHEDULED') return 'Convocado'
  if (assembly.status === 'IN_PROGRESS') return 'Asamblea en curso'
  if (assembly.status === 'CANCELLED') return 'Asamblea cancelada'
  if (assembly.attendanceStatus === 'PRESENT') return 'Finalizada · Asistió'
  if (assembly.justification?.status === 'PENDING') return 'Finalizada · Ausente · Justificación enviada'
  if (assembly.justification?.status === 'APPROVED') return 'Finalizada · Ausencia justificada'
  if (assembly.justification?.status === 'REJECTED') return 'Finalizada · Justificación rechazada'
  return 'Finalizada · Ausente'
}

export function MineAssembliesPage() {
  const query = useMineAssemblies()
  return <section className="space-y-6"><PageHeader context="Comunidad" title="Mis asambleas" description="Consulte las asambleas a las que fue convocado." />
    {query.isPending ? <LoadingState label="Cargando sus asambleas..." /> : null}
    {query.isError ? <ErrorState message={getErrorMessage(query.error, 'No fue posible cargar sus asambleas.')} /> : null}
    {query.data?.length === 0 ? <EmptyState title="No tiene asambleas convocadas" description="Cuando sea convocado, la información aparecerá aquí." /> : null}
    <div className="grid gap-4">{query.data?.map((item) => {
      const mayJustify = item.assembly.status === 'COMPLETED' && item.assembly.attendanceStatus === 'ABSENT' && !item.assembly.justification
      return <article key={item.id} className="rounded-xl border border-border bg-surface p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-brand-ink">{item.assembly.title}</h2><p className="mt-1">{new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.assembly.date))} · {item.assembly.place}</p></div><span className="rounded-full bg-brand-soft/20 px-3 py-1 text-sm font-semibold text-brand-deep">{personalStatus(item)}</span></div><p className="mt-2 text-body-small text-foreground-muted">Rol al momento de la convocatoria: {item.roleNameSnapshot}</p>{item.assembly.description ? <p className="mt-3">{item.assembly.description}</p> : null}{mayJustify ? <Link className="mt-4 inline-flex min-h-11 items-center rounded-md bg-brand-deep px-4 font-semibold text-brand-ivory" to={`/app/affiliate/absence-justifications/new?assemblyId=${item.assembly.id}`}>Justificar ausencia</Link> : null}</article>
    })}</div>
  </section>
}
