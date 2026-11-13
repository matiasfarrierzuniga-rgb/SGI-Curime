import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardAction,
} from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { displayCount } from "../model/displayCount";
import type { Icon, Tone } from "./dashboard.types";

export function DashboardCard({
  title,
  description,
  count,
  children,
}: {
  title: string;
  description?: string;
  icon: Icon;
  tone: Tone;
  count?: number;
  children: ReactNode;
}) {
  const id = `admin-${title.toLowerCase().replaceAll(" ", "-")}-title`;
  return (
    <Card className="h-full gap-0 border-erp-border bg-erp-surface-raised py-4 shadow-elevation-0">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div>
          <h2
            id={id}
            className="font-sans text-heading-3 font-bold leading-snug tracking-[-0.01em] text-erp-text"
          >
            {title}
          </h2>
          {description ? (
            <CardDescription className="mt-0.5 text-caption">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {count !== undefined ? (
          <CardAction>
            <span
              aria-label={`${displayCount(count)} pendientes`}
              className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-status-danger px-2 py-0.5 text-caption font-bold leading-none text-text-inverse"
            >
              {displayCount(count)}
            </span>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="mt-3">{children}</CardContent>
    </Card>
  );
}

export function InlineRetry({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="py-8 text-center">
      <p className="text-body-small text-erp-text-muted">{message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={onRetry}
      >
        Reintentar
      </Button>
    </div>
  );
}

export function IconTile({
  icon: IconComponent,
  tone = "success",
  size = "default",
}: {
  icon: Icon;
  tone?: Tone;
  size?: "default" | "sm";
}) {
  const tones: Record<Tone, string> = {
    success: "bg-status-success-surface text-status-success",
    warning: "bg-status-warning-surface text-status-warning",
    danger: "bg-status-danger-surface text-status-danger",
    info: "bg-status-info-surface text-status-info",
    violet: "bg-status-info-surface text-status-info",
  };
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-control ${size === "sm" ? "size-8" : "size-10"} ${tones[tone]}`}
    >
      <IconComponent
        className={size === "sm" ? "size-4" : "size-5"}
        aria-hidden="true"
      />
    </span>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      className="mt-4 space-y-3"
      aria-label="Cargando indicadores administrativos"
    >
      <Skeleton className="h-38" />
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 min-[1200px]:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-35" />
        ))}
      </div>
      <div className="grid min-w-0 gap-3 min-[1200px]:grid-cols-3">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
