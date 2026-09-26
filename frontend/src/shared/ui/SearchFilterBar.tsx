import type { ComponentProps, ReactNode } from "react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

type SearchFilterBarProps = Omit<ComponentProps<"form">, "children"> & {
  children: ReactNode
  actions?: ReactNode
  label?: string
}

function SearchFilterBar({ className, children, actions, label = "Buscar y filtrar", ...props }: SearchFilterBarProps) {
  return (
    <form data-slot="search-filter-bar" role="search" aria-label={label} className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end", className)} {...props}>
      <div data-slot="search-filter-controls" className="flex min-w-0 flex-wrap gap-3 [&>[data-slot=search-input]]:basis-full [&>[data-slot=search-input]]:sm:basis-64">{children}</div>
      {actions && <div data-slot="search-filter-actions" className="flex flex-wrap items-center gap-2">{actions}</div>}
    </form>
  )
}

function SearchInput({ className, type: _type, ...props }: ComponentProps<typeof Input>) {
  return <Input data-slot="search-input" type="search" className={cn("min-w-0", className)} {...props} />
}

function SearchFilterReset({ className, children = "Limpiar", ...props }: ComponentProps<typeof Button>) {
  return <Button type="reset" variant="ghost" className={className} {...props}>{children}</Button>
}

const SearchFilterClear = SearchFilterReset

export { SearchFilterBar, SearchFilterClear, SearchFilterReset, SearchInput }
export type { SearchFilterBarProps }
