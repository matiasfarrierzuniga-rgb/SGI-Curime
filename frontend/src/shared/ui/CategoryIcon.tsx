import type { ComponentProps, ComponentType } from "react"
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
  | "entrepreneurship"
  | "volunteering"
  | "news"
  | "transparency"
  | "contact"

type CategoryIconSize = "sm" | "md" | "lg"

type CategoryIconGlyph = ComponentType<{
  className?: string
  strokeWidth?: number
  "aria-hidden"?: boolean | "true" | "false"
}>

const tones: Record<CategoryIconTone, string> = {
  institutional: "bg-public-icon-institutional-surface text-public-icon-institutional",
  affiliates: "bg-status-success-surface text-status-success",
  assemblies: "bg-status-success-surface text-status-success",
  reservations: "bg-status-info-surface text-status-info",
  inventory: "bg-status-warning-surface text-status-warning",
  events: "bg-status-warning-surface text-status-warning",
  donations: "bg-status-danger-surface text-status-danger",
  entrepreneurship: "bg-public-icon-entrepreneurship-surface text-public-icon-entrepreneurship",
  volunteering: "bg-public-icon-volunteering-surface text-public-icon-volunteering",
  news: "bg-public-icon-news-surface text-public-icon-news",
  transparency: "bg-public-icon-transparency-surface text-public-icon-transparency",
  contact: "bg-public-icon-contact-surface text-public-icon-contact",
}

const sizes: Record<CategoryIconSize, { box: string; glyph: string }> = {
  sm: { box: "size-9", glyph: "size-4" },
  md: { box: "size-10", glyph: "size-5" },
  lg: { box: "size-12", glyph: "size-6" },
}

function CategoryIcon({
  icon: Icon,
  tone = "institutional",
  size = "md",
  className,
  ...props
}: {
  icon: CategoryIconGlyph | LucideIcon
  tone?: CategoryIconTone
  size?: CategoryIconSize
} & ComponentProps<"span">) {
  const dimensions = sizes[size]

  return (
    <span className={cn("grid shrink-0 place-items-center rounded-control", dimensions.box, tones[tone], className)} {...props}>
      <Icon className={dimensions.glyph} strokeWidth={1.75} aria-hidden="true" />
    </span>
  )
}

export { CategoryIcon }
export type { CategoryIconGlyph, CategoryIconSize, CategoryIconTone }
