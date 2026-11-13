import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

type MetricCardState = "success" | "warning" | "danger" | "info" | "neutral"
type MetricCardVariant = "default" | "compact"

type MetricCardProps = {
  label: string
  value: ReactNode
  supportingText?: ReactNode
  icon?: ReactNode
  className?: string
  variant?: MetricCardVariant
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

const iconClasses = {
  success: "bg-status-success-surface text-status-success",
  warning: "bg-status-warning-surface text-status-warning",
  danger: "bg-status-danger-surface text-status-danger",
  info: "bg-status-info-surface text-status-info",
  neutral: "bg-erp-surface-subtle text-erp-navigation",
} as const

function MetricCard({ label, value, supportingText, icon, state = "neutral", stateLabel, className, variant = "compact" }: MetricCardProps) {
  if (variant === "compact") {
    return (
      <article className={cn("flex min-h-32 flex-col rounded-surface border border-erp-border bg-erp-surface-raised p-4 shadow-elevation-0", className)}>
        <div className="flex items-start gap-3">
          {icon && <div className={cn("grid size-10 shrink-0 place-items-center rounded-control", iconClasses[state])} aria-hidden="true">{icon}</div>}
          <div className="min-w-0 pt-0.5">
            <p className="text-label font-semibold text-erp-text">{label}</p>
            {(stateLabel || supportingText) && <p className="mt-0.5 text-caption text-erp-text-muted">{stateLabel ?? supportingText}</p>}
          </div>
        </div>
        <div className="mt-3 border-t border-erp-border pt-3">
          <p className="text-heading-3 font-bold tabular-nums text-erp-navigation">{value}</p>
          {supportingText && stateLabel && <p className="mt-1 text-caption text-erp-text-muted">{supportingText}</p>}
        </div>
      </article>
    )
  }

  return (
    <article className={cn("rounded-surface border border-erp-border border-l-4 bg-erp-surface-raised p-5 shadow-elevation-0", stateClasses[state], className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-label font-semibold text-erp-text">{label}</p>
          <p className="mt-1 text-heading-2 font-bold tabular-nums text-erp-navigation">{value}</p>
          {stateLabel && <p className="mt-1 text-caption font-semibold text-erp-text-muted">{stateLabel}</p>}
        </div>
        {icon && <div className={cn("grid size-11 shrink-0 place-items-center rounded-control", iconClasses[state])} aria-hidden="true">{icon}</div>}
      </div>
      {supportingText && <p className="mt-2 text-body-small text-erp-text-muted">{supportingText}</p>}
    </article>
  )
}

export { MetricCard }
export type { MetricCardProps, MetricCardVariant }
