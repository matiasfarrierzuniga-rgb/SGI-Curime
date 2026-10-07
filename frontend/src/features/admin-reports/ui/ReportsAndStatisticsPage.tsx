import { useState } from 'react'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import { EmptyState } from '@/shared/ui/EmptyState'
import { AffiliatesReportPage } from './AffiliatesReportPage'
import { AssembliesReportPanel } from './AssembliesReportPanel'
import { VenturesReportPanel } from './VenturesReportPanel'

type ReportSection = 'affiliates' | 'assemblies' | 'ventures'

const sectionLabels: Record<ReportSection, string> = {
  affiliates: 'Afiliados',
  assemblies: 'Asambleas',
  ventures: 'Emprendimientos',
}

export function ReportsAndStatisticsPage() {
  const { user } = useAuth()
  const sections = ([
    {
      id: 'affiliates',
      capability: 'adm.affiliates.read',
    },
    {
      id: 'assemblies',
      capability: 'adm.assemblies.read',
    },
    {
      id: 'ventures',
      capability: 'ent.ventures.read',
    },
  ] as const).filter(({ capability }) =>
    hasCapability(user?.permissionCodes, capability),
  )
  const [selected, setSelected] = useState<ReportSection>('affiliates')
  const activeSection = sections.some(({ id }) => id === selected)
    ? selected
    : sections[0]?.id

  if (!activeSection) {
    return (
      <EmptyState
        title="No hay reportes disponibles"
        description="Su perfil no tiene permisos para consultar los reportes de este módulo."
      />
    )
  }

  return (
    <section className="space-y-5">
      <div
        className="flex flex-wrap gap-2 border-b border-border-default pb-3"
        role="group"
        aria-label="Seleccionar reporte"
      >
        {sections.map(({ id }) => (
          <button
            key={id}
            type="button"
            aria-pressed={activeSection === id}
            className={`min-h-11 rounded-control px-4 text-body-small font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
              activeSection === id
                ? 'bg-brand-deep text-brand-ivory'
                : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
            }`}
            onClick={() => setSelected(id)}
          >
            {sectionLabels[id]}
          </button>
        ))}
      </div>
      <div
        role="region"
        aria-label={sectionLabels[activeSection]}
        tabIndex={0}
      >
        {activeSection === 'affiliates' ? <AffiliatesReportPage /> : null}
        {activeSection === 'assemblies' ? <AssembliesReportPanel /> : null}
        {activeSection === 'ventures' ? <VenturesReportPanel /> : null}
      </div>
    </section>
  )
}
