import { cn } from "@/shared/lib/utils"

type StatusMessageProps = {
  error?: string
  success?: string
  className?: string
}

function StatusMessage({ error, success, className }: StatusMessageProps) {
  if (error) {
    return <div className={cn("message error rounded-control border border-status-danger/30 bg-status-danger-surface text-status-danger", className)} role="alert">{error}</div>
  }

  if (success) {
    return <div className={cn("message success rounded-control border border-status-success/30 bg-status-success-surface text-status-success", className)} role="status">{success}</div>
  }

  return null
}

export { StatusMessage }
export type { StatusMessageProps }
