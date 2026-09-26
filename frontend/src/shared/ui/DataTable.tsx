import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

type DataTableProps = ComponentProps<"table"> & {
  containerClassName?: string
  scrollLabel?: string
  columnCount?: number
  loading?: boolean
  empty?: ReactNode
  error?: ReactNode
  pagination?: ReactNode
}

function DataTable({
  className,
  containerClassName,
  scrollLabel = "Tabla desplazable horizontalmente",
  columnCount = 1,
  loading = false,
  empty,
  error,
  pagination,
  children,
  ...props
}: DataTableProps) {
  const state = error ?? (loading ? "Cargando datos…" : empty)

  return (
    <div data-slot="data-table-layout" className="grid gap-4">
      <div data-slot="data-table-container" className={cn("w-full overflow-x-auto rounded-surface border border-border bg-surface", containerClassName)} tabIndex={0} aria-label={scrollLabel}>
        <table data-slot="data-table" className={cn("w-full min-w-full border-collapse text-body-small", className)} {...props}>
          {state ? (
            <tbody>
              <tr>
                <td colSpan={columnCount} className={cn("px-4 py-8 text-center text-muted-foreground", error && "text-status-error-foreground")} role={error ? "alert" : "status"}>
                  {state}
                </td>
              </tr>
            </tbody>
          ) : children}
        </table>
      </div>
      {pagination && <div data-slot="data-table-pagination">{pagination}</div>}
    </div>
  )
}

function DataTableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead data-slot="data-table-header" className={cn("bg-surface-muted", className)} {...props} />
}

function DataTableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody data-slot="data-table-body" className={className} {...props} />
}

function DataTableHead({ className, scope = "col", ...props }: ComponentProps<"th">) {
  return <th data-slot="data-table-head" scope={scope} className={cn("border-b border-border bg-surface-muted px-4 py-3 text-left text-label font-semibold text-foreground", className)} {...props} />
}

function DataTableCell({ className, ...props }: ComponentProps<"td">) {
  return <td data-slot="data-table-cell" className={cn("border-b border-border-subtle px-4 py-3 align-top text-foreground", className)} {...props} />
}

function DataTableRow({ className, ...props }: ComponentProps<"tr">) {
  return <tr data-slot="data-table-row" className={cn("transition-colors hover:bg-surface-muted/60", className)} {...props} />
}

export { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow }
export type { DataTableProps }
