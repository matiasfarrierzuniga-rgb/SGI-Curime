import * as React from "react"

import { cn } from "@/shared/lib/utils"

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-(--size-control) w-full min-w-0 rounded-control border border-border bg-control px-(--spacing-control-x) py-(--spacing-control-y) text-base text-foreground transition-[border-color,box-shadow] outline-none hover:border-border-strong focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-control-disabled disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className,
      )}
      {...props}
    />
  )
}

export { Select }
