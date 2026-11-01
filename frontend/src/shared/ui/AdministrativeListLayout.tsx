import { useId, type ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

type AdministrativeListLayoutProps = {
  header: ReactNode
  filters?: ReactNode
  children: ReactNode
  className?: string
}

type AdministrativeListResultsProps = {
  count: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  heading?: string
}

function AdministrativeListLayout({ header, filters, children, className }: AdministrativeListLayoutProps) {
  return (
    <section data-slot="administrative-list-layout" className={cn("min-w-0 space-y-6", className)}>
      {header}
      {filters ? <div data-slot="administrative-list-filters">{filters}</div> : null}
      {children}
    </section>
  )
}

function AdministrativeListResults({ count, actions, children, className, heading = "Resultados" }: AdministrativeListResultsProps) {
  const headingId = useId()

  return (
    <section data-slot="administrative-list-results" aria-labelledby={headingId} className={cn("min-w-0 space-y-4", className)}>
      <div data-slot="administrative-list-results-toolbar" className="flex flex-col gap-1 border-b border-border-subtle pb-3 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 id={headingId} className="sr-only">{heading}</h2>
        <p className="text-body-small font-semibold tabular-nums text-text-primary" aria-live="polite">{count}</p>
        {actions ? <div className="text-caption text-text-secondary">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

export { AdministrativeListLayout, AdministrativeListResults }
export type { AdministrativeListLayoutProps, AdministrativeListResultsProps }
