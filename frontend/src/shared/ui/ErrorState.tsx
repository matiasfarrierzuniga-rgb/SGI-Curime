import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

type ErrorStateProps = {
  title?: string
  message: ReactNode
  action?: ReactNode
  className?: string
}

function ErrorState({ title = "No fue posible cargar el contenido", message, action, className }: ErrorStateProps) {
  return (
    <section className={cn("rounded-surface border border-status-danger/30 bg-status-danger-surface p-5 text-status-danger", className)} role="alert">
      <h2 className="font-heading text-heading-3">{title}</h2>
      <p className="mt-2">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </section>
  )
}

export { ErrorState }
export type { ErrorStateProps }
