import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

type MetricCardState = "success" | "warning" | "danger" | "info" | "neutral"

type MetricCardProps = {
  label: string
  value: ReactNode
  supportingText?: ReactNode
  icon?: ReactNode
  className?: string
} & (
  | { state?: undefined; stateLabel?: never }
  | { state: MetricCardState; stateLabel: string }
)

const stateClasses = {
  success: "border-l-status-success",
  warning: "border-l-status-warning",
  danger: "border-l-status-danger",
  info: "border-l-status-info",
  neutral: "border-l-status-neutral",
} as const

function MetricCard({ label, value, supportingText, icon, state = "neutral", stateLabel, className }: MetricCardProps) {
  return (
    <article className={cn("rounded-surface border border-border-default border-l-4 bg-surface-card p-4 shadow-surface", stateClasses[state], className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-1 text-heading-2 font-bold tabular-nums text-text-primary">{value}</p>
          {stateLabel && <p className="mt-1 text-xs font-semibold text-text-secondary">{stateLabel}</p>}
        </div>
        {icon && <div className="shrink-0 text-text-secondary" aria-hidden="true">{icon}</div>}
      </div>
      {supportingText && <p className="mt-2 text-sm text-text-muted">{supportingText}</p>}
    </article>
  )
}

export { MetricCard }
export type { MetricCardProps }
