import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

type FormSectionProps = Omit<ComponentProps<"fieldset">, "children"> & {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

function FormSection({ className, title, description, actions, children, ...props }: FormSectionProps) {
  return (
    <fieldset data-slot="form-section" className={cn("grid gap-5 border-0 p-0", className)} {...props}>
      <legend className="text-heading-3 font-semibold text-foreground text-balance">{title}</legend>
      {(description || actions) && (
        <div className="-mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {description && <p className="max-w-2xl text-body-small text-muted-foreground text-pretty">{description}</p>}
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div data-slot="form-section-fields" className="grid gap-4">
        {children}
      </div>
    </fieldset>
  )
}

export { FormSection }
export type { FormSectionProps }
