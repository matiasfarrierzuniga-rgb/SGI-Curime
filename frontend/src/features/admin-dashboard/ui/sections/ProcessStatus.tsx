import { CircleAlert } from "lucide-react";
import { DashboardCard } from "../primitives";

export function ProcessStatus() {
  return (
    <section aria-labelledby="admin-process-title">
      <DashboardCard title="Estado de procesos" icon={CircleAlert} tone="warning">
        <div className="flex min-h-36 items-center gap-4 rounded-control border border-dashed border-erp-border bg-erp-surface-subtle/50 px-4 py-4">
          <div className="grid size-20 shrink-0 place-items-center rounded-full border-8 border-dashed border-erp-border bg-erp-surface-raised text-center">
            <div>
              <p className="text-heading-3 font-bold leading-none text-erp-text">—</p>
              <p className="mt-1 text-caption text-erp-text-muted">Sin cálculo</p>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-body-small font-bold text-erp-text">
              <CircleAlert className="size-4 text-erp-accent" aria-hidden="true" />
              Información no disponible
            </div>
            <p className="mt-1.5 text-caption leading-relaxed text-erp-text-muted">
              No existe una definición institucional verificable para calcular un porcentaje global de procesos.
            </p>
          </div>
        </div>
      </DashboardCard>
    </section>
  );
}
