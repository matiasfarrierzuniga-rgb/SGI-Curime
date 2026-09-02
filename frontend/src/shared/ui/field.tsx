import { Field as FieldPrimitive } from "@base-ui/react/field"

import { cn } from "@/shared/lib/utils"

function Field({ className, ...props }: FieldPrimitive.Root.Props) {
  return <FieldPrimitive.Root data-slot="field" className={cn("grid gap-1.5", className)} {...props} />
}

function FieldLabel({ className, ...props }: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn("text-label font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn("text-body-small text-muted-foreground", className)}
      {...props}
    />
  )
}

function FieldError({ className, ...props }: FieldPrimitive.Error.Props) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      className={cn("text-body-small font-medium text-destructive", className)}
      {...props}
    />
  )
}

function FieldControl({ className, ...props }: FieldPrimitive.Control.Props) {
  return <FieldPrimitive.Control data-slot="field-control" className={cn("w-full", className)} {...props} />
}

export { Field, FieldControl, FieldDescription, FieldError, FieldLabel }
