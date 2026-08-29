import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

type MetricCardProps = {
  label: string
  value: ReactNode
  supportingText?: ReactNode
  icon?: ReactNode
  state?: "success" | "warning" | "danger" | "info" | "neutral"
  className?: string
}

const stateClasses = {
  success: "border-l-status-success",
  warning: "border-l-status-warning",
  danger: "border-l-status-danger",
  info: "border-l-status-info",
  neutral: "border-l-status-neutral",
} as const

function MetricCard({ label, value, supportingText, icon, state = "neutral", className }: MetricCardProps) {
  return (
    <article className={cn("rounded-surface border border-border-default border-l-4 bg-surface-card p-4 shadow-surface", stateClasses[state], className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-1 text-heading-2 font-bold tabular-nums text-text-primary">{value}</p>
        </div>
        {icon && <div className="shrink-0 text-text-secondary" aria-hidden="true">{icon}</div>}
      </div>
      {supportingText && <p className="mt-2 text-sm text-text-muted">{supportingText}</p>}
    </article>
  )
}

export { MetricCard }
export type { MetricCardProps }
