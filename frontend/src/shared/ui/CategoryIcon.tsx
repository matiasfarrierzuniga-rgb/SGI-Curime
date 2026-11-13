import type { ComponentProps } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

type CategoryIconTone =
  | "institutional"
  | "affiliates"
  | "assemblies"
  | "reservations"
  | "inventory"
  | "events"
  | "donations"

const tones: Record<CategoryIconTone, string> = {
  institutional: "bg-status-success-surface text-status-success",
  affiliates: "bg-status-success-surface text-status-success",
  assemblies: "bg-status-success-surface text-status-success",
  reservations: "bg-status-info-surface text-status-info",
  inventory: "bg-status-warning-surface text-status-warning",
  events: "bg-status-warning-surface text-status-warning",
  donations: "bg-status-danger-surface text-status-danger",
}

function CategoryIcon({
  icon: Icon,
  tone = "institutional",
  className,
  ...props
}: {
  icon: LucideIcon
  tone?: CategoryIconTone
} & ComponentProps<"span">) {
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-control", tones[tone], className)} {...props}>
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}

export { CategoryIcon }
export type { CategoryIconTone }
