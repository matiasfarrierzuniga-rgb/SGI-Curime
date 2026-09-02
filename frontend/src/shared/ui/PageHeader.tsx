import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

type PageHeaderProps = {
  title: string
  description?: ReactNode
  context?: ReactNode
  actions?: ReactNode
  className?: string
}

function PageHeader({ title, description, context, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col justify-between gap-4 border-b border-border-default pb-6 sm:flex-row sm:items-end", className)}>
      <div>
        {context && <div className="mb-2 text-sm text-text-secondary">{context}</div>}
        <h1 className="font-heading text-heading-1 text-text-primary">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export { PageHeader }
export type { PageHeaderProps }
