import { cn } from "@/shared/lib/utils"

type LoadingStateProps = {
  label?: string
  className?: string
}

function LoadingState({ label = "Cargando contenido...", className }: LoadingStateProps) {
  return (
    <div className={cn("flex min-h-20 items-center justify-center text-text-secondary", className)} role="status">
      <span className="size-2 rounded-full bg-brand-primary motion-safe:animate-pulse" aria-hidden="true" />
      <span className="ml-2">{label}</span>
    </div>
  )
}

export { LoadingState }
export type { LoadingStateProps }
