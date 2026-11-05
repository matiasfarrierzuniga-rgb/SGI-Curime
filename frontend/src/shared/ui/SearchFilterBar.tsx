import type { ComponentProps, ReactNode } from "react"
import { Search } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

type SearchFilterBarProps = Omit<ComponentProps<"form">, "children"> & {
  children: ReactNode
  actions?: ReactNode
  label?: string
  controlsClassName?: string
}

function SearchFilterBar({ className, children, actions, controlsClassName, label = "Buscar y filtrar", ...props }: SearchFilterBarProps) {
  return (
    <form data-slot="search-filter-bar" aria-label={label} className={cn("flex flex-col gap-4 md:flex-row md:items-start", className)} {...props}>
      <div data-slot="search-filter-controls" className={cn("grid min-w-0 flex-1 grid-cols-1 items-start gap-4 sm:grid-cols-2", controlsClassName)}>{children}</div>
      {actions && <div data-slot="search-filter-actions" className="flex flex-wrap gap-2 self-start md:pt-7">{actions}</div>}
    </form>
  )
}

function SearchInput({ className, type: _type, disabled, ...props }: ComponentProps<typeof Input>) {
  return (
    <div
      data-slot="search-input"
      data-invalid={props["aria-invalid"] === true || props["aria-invalid"] === "true" ? "true" : undefined}
      className="grid h-(--size-control) min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-center rounded-control border border-border bg-control text-foreground transition-[border-color,box-shadow] hover:border-border-strong focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[input:disabled]:cursor-not-allowed has-[input:disabled]:bg-control-disabled has-[input:disabled]:opacity-50 data-[invalid=true]:border-destructive data-[invalid=true]:focus-within:ring-destructive/20"
    >
      <span aria-hidden="true" className="pointer-events-none grid size-10 place-items-center text-muted-foreground">
        <Search className="size-4" />
      </span>
      <Input
        type="search"
        disabled={disabled}
        className={cn("h-full rounded-none border-0 bg-transparent px-0 py-0 focus-visible:border-0 focus-visible:ring-0 aria-invalid:ring-0", className)}
        {...props}
      />
    </div>
  )
}

function SearchFilterReset({ className, children = "Limpiar", ...props }: ComponentProps<typeof Button>) {
  return <Button type="reset" variant="ghost" className={className} {...props}>{children}</Button>
}

const SearchFilterClear = SearchFilterReset

export { SearchFilterBar, SearchFilterClear, SearchFilterReset, SearchInput }
export type { SearchFilterBarProps }
