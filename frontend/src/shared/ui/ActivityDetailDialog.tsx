import type { ReactNode } from 'react'
import { CalendarDays } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

type ActivityDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: ReactNode
}

export function ActivityDetailDialog({ open, onOpenChange, title, description, children }: ActivityDetailDialogProps) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent size="lg" className="max-w-5xl gap-5 p-5 sm:p-7"><DialogHeader className="pr-9"><DialogTitle className="text-heading-2 text-balance">{title}</DialogTitle></DialogHeader><div className="flex min-w-0 items-center gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-erp-surface-subtle text-erp-navigation"><CalendarDays className="size-6" aria-hidden="true" /></span><DialogDescription className="min-w-0 text-body-small text-erp-text-muted text-pretty">{description}</DialogDescription></div>{children}</DialogContent></Dialog>
}
