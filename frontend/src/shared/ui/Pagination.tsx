import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

type PaginationProps = {
  page: number
  total: number
  limit: number
  onChange: (page: number) => void
  className?: string
  label?: string
}

function Pagination({ page, total, limit, onChange, className, label = "Paginación" }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / Math.max(1, limit)))

  return (
    <nav aria-label={label} className={cn("flex flex-col gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-body-small text-muted-foreground tabular-nums" aria-live="polite">
        Página {page} de {pages} ({total} resultados)
      </p>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Siguiente
        </Button>
      </div>
    </nav>
  )
}

export { Pagination }
export type { PaginationProps }
