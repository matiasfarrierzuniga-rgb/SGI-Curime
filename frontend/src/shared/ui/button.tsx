import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-control border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-interaction-primary-default text-primary-foreground shadow-sm hover:bg-interaction-primary-hover hover:shadow-md active:bg-interaction-primary-active",
        default: "bg-interaction-primary-default text-primary-foreground shadow-sm hover:bg-interaction-primary-hover hover:shadow-md active:bg-interaction-primary-active",
        accent: "bg-accent text-accent-foreground hover:bg-accent/85 active:bg-accent/90 focus-visible:border-accent focus-visible:ring-accent/50",
        outline: "border-primary bg-transparent text-primary hover:bg-primary/10 active:bg-primary/15",
        inverse: "border-brand-ivory bg-brand-ivory text-brand-ink shadow-sm hover:border-brand-accent hover:bg-brand-accent active:bg-brand-accent/90 focus-visible:border-brand-accent focus-visible:ring-brand-accent/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90",
        ghost: "hover:bg-muted hover:text-foreground active:bg-muted/50 dark:hover:bg-muted/50",
        danger: "bg-interaction-danger-default text-destructive-foreground shadow-sm hover:bg-interaction-danger-hover active:bg-interaction-danger-active focus-visible:border-destructive focus-visible:ring-destructive/30",
        destructive: "bg-interaction-danger-default text-destructive-foreground shadow-sm hover:bg-interaction-danger-hover active:bg-interaction-danger-active focus-visible:border-destructive focus-visible:ring-destructive/30",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
      },
      size: {
        default: "h-11 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-11",
        "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />}
      {children}
      {loading && <span className="sr-only">Cargando</span>}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
