import { CalendarDays, Sun } from "lucide-react";

export function InstitutionalDashboardWelcome({
  fullName,
  generatedAt,
}: {
  fullName?: string;
  generatedAt?: string;
}) {
  const firstName = fullName?.trim().split(/\s+/)[0];
  const date = generatedAt ? formatDashboardDate(generatedAt) : null;
  return (
    <header className="relative isolate overflow-hidden border-y border-erp-border bg-erp-surface-subtle xl:-mx-6 xl:-mt-9">
      <img
        src="/images/public/home/hero-curime-wide.webp"
        alt=""
        className="absolute inset-0 -z-20 size-full object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-surface-card via-surface-card/90 to-surface-card/35"
      />
      <div className="grid gap-5 px-5 py-6 sm:px-7 md:px-10 md:py-7 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.62fr)] lg:items-center">
        <div className="flex min-w-0 gap-3 sm:gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-status-warning-surface text-erp-accent">
            <Sun className="size-7" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-caption font-bold uppercase tracking-[0.16em] text-erp-accent">
              Administración
            </p>
            <h1
              id="admin-indicators-title"
              className="mt-1 font-sans text-heading-1 font-bold leading-tight tracking-[-0.025em] text-erp-navigation"
            >
              Buenos días{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-1 text-body text-erp-text">
              Aquí tiene el resumen de la gestión de la ADI Curime.
            </p>
            {date ? (
              <p className="mt-3 flex items-center gap-2 text-body-small text-erp-text">
                <CalendarDays
                  className="size-4 shrink-0 text-erp-navigation"
                  aria-hidden="true"
                />
                <time dateTime={generatedAt}>{date}</time>
              </p>
            ) : null}
          </div>
        </div>
        <aside className="rounded-surface border border-surface-card bg-surface-card px-5 py-4 text-erp-navigation shadow-elevation-1">
          <p className="font-sans text-heading-3 font-semibold leading-snug tracking-[-0.01em]">
            Una comunidad organizada construye más oportunidades.
          </p>
          <p className="mt-2 text-body-small text-erp-text-muted">ADI Curime</p>
        </aside>
      </div>
    </header>
  );
}

function formatDashboardDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-CR", {
        dateStyle: "full",
        timeZone: "America/Costa_Rica",
      }).format(date);
}
