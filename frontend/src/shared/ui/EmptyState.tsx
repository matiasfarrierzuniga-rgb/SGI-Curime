import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

type EmptyStateProps = {
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <section className={cn("rounded-surface border border-border-default bg-surface-card p-6 text-center", className)}>
      <h2 className="font-heading text-heading-3 text-text-primary">{title}</h2>
      {description && <p className="mt-2 text-text-secondary">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </section>
  )
}

export { EmptyState }
export type { EmptyStateProps }
