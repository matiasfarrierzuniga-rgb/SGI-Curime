import { createContext, useCallback, useContext, type ReactNode } from "react"
import { Toaster as SonnerToaster, toast } from "sonner"

type ToastKind = "success" | "error" | "warning" | "info"

const ToastContext = createContext<{ notify: (message: string, kind?: ToastKind) => void } | undefined>(undefined)

function ToastProvider({ children }: { children: ReactNode }) {
  const notify = useCallback((message: string, kind: ToastKind = "info") => {
    if (kind === "success") return toast.success(message)
    if (kind === "error") return toast.error(message)
    if (kind === "warning") return toast.warning(message)
    return toast.info(message)
  }, [])

  return <ToastContext.Provider value={{ notify }}>{children}</ToastContext.Provider>
}

function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "border-border bg-surface text-foreground shadow-overlay",
          title: "font-semibold text-foreground",
          description: "text-muted-foreground",
          success: "border-status-success/30 bg-status-success-surface text-status-success",
          error: "border-status-danger/30 bg-status-danger-surface text-status-danger",
          warning: "border-status-warning/30 bg-status-warning-surface text-status-warning",
          info: "border-status-info/30 bg-status-info-surface text-status-info",
          closeButton: "border-border bg-surface text-foreground",
        },
      }}
    />
  )
}

function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error("useToast debe usarse dentro de ToastProvider")
  return value
}

export { toast, Toaster, ToastProvider, useToast }
