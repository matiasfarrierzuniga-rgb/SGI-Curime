import { cloneElement, type ComponentProps, type ReactElement, type ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

type ControlProps = {
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
}

type FormFieldProps = Omit<ComponentProps<"div">, "children" | "id"> & {
  id: string
  label: ReactNode
  description?: ReactNode
  error?: ReactNode
  required?: boolean
  children: ReactElement<ControlProps>
}

function FormField({
  className,
  id,
  label,
  description,
  error,
  required = false,
  children,
  ...props
}: FormFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [children.props["aria-describedby"], descriptionId, errorId].filter(Boolean).join(" ") || undefined
  const control = cloneElement(children, {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : children.props["aria-invalid"],
  })

  return (
    <div data-slot="form-field" className={cn("grid gap-1.5", className)} {...props}>
      <label className="text-label font-semibold text-foreground" htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
        {required && <span className="sr-only"> (requerido)</span>}
      </label>
      {control}
      {description && <p id={descriptionId} data-slot="form-field-description" className="text-body-small text-muted-foreground">{description}</p>}
      {error && <p id={errorId} data-slot="form-field-error" className="text-body-small font-medium text-destructive" role="alert">{error}</p>}
    </div>
  )
}

export { FormField }
export type { FormFieldProps }
