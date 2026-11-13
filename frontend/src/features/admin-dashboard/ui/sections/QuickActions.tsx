import { ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/shared/ui/EmptyState";
import { DashboardCard, IconTile } from "../primitives";
import type { QuickAction } from "../dashboard.types";

export function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  return (
    <section aria-label="Accesos rápidos">
      <DashboardCard title="Accesos rápidos" icon={ClipboardList} tone="info">
        {actions.length ? (
          <nav
            aria-label="Accesos rápidos administrativos"
            className="grid grid-cols-3 gap-2"
          >
            {actions.map((action) => (
              <QuickActionItem key={action.path} action={action} />
            ))}
          </nav>
        ) : (
          <EmptyState
            className="py-8"
            title="No hay accesos disponibles."
            description="No cuenta con acciones administrativas autorizadas."
          />
        )}
      </DashboardCard>
    </section>
  );
}

function QuickActionItem({ action }: { action: QuickAction }) {
  return (
    <Link
      to={action.path}
      className="group flex min-h-28 flex-col items-center justify-center gap-2 rounded-control border border-erp-border bg-erp-surface-subtle/70 p-2 text-center transition-colors hover:border-erp-border-strong hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erp-focus"
    >
      <IconTile icon={action.icon} tone={action.tone} />
      <span className="text-body-small font-semibold leading-snug text-erp-text">
        {action.label}
      </span>
    </Link>
  );
}
