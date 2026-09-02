import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "@/shared/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        success: "bg-status-success-surface text-status-success",
        warning: "bg-status-warning-surface text-status-warning",
        danger: "bg-status-danger-surface text-status-danger",
        info: "bg-status-info-surface text-status-info",
        neutral: "bg-status-neutral-surface text-status-neutral",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
)

type StatusBadgeProps = ComponentProps<"span"> & VariantProps<typeof statusBadgeVariants>

function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return <span className={cn(statusBadgeVariants({ variant }), className)} {...props} />
}

export { StatusBadge }
export type { StatusBadgeProps }
