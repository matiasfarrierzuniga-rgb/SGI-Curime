import type { ComponentProps } from "react"

import { cn } from "@/shared/lib/utils"

type PageContainerProps = ComponentProps<"div">

function PageContainer({ className, ...props }: PageContainerProps) {
  return (
    <div
      data-slot="page-container"
      className={cn("mx-auto w-full max-w-(--container-max) px-(--spacing-page-inline) py-(--spacing-page-block)", className)}
      {...props}
    />
  )
}

export { PageContainer }
export type { PageContainerProps }
