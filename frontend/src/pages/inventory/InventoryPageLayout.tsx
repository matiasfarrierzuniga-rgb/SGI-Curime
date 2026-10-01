import type { ReactNode } from 'react'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageHeader } from '@/shared/ui/PageHeader'

type InventoryPageLayoutProps = {
  title: string
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export function InventoryPageLayout({ title, description, actions, children }: InventoryPageLayoutProps) {
  return (
    <PageContainer className="inventory-page space-y-5 sm:space-y-6 [&_.actions]:flex [&_.actions]:flex-wrap [&_.actions]:items-center [&_.actions]:gap-2 [&_.actions_button]:min-h-10 [&_.actions_.button-link]:min-h-10 [&_.alert-group]:space-y-3 [&_.alert-item]:flex [&_.alert-item]:flex-col [&_.alert-item]:gap-3 [&_.alert-item]:border-b [&_.alert-item]:border-border-subtle [&_.alert-item]:py-3 last:[&_.alert-item]:border-b-0 sm:[&_.alert-item]:flex-row [&_.alert-item]:items-start [&_.alert-item]:justify-between [&_.alert-main]:min-w-0 [&_.alert-main]:space-y-1 [&_.alert-main_strong]:text-body-small [&_.alert-main_.muted]:text-body-small [&_.alert-list]:divide-y [&_.detail-grid]:grid [&_.detail-grid]:gap-2.5 sm:[&_.detail-grid]:grid-cols-2 [&_.detail-grid>div]:min-w-0 [&_.detail-grid>div]:rounded-control [&_.detail-grid>div]:border [&_.detail-grid>div]:border-border-subtle [&_.detail-grid>div]:bg-surface-muted [&_.detail-grid>div]:p-3 [&_.detail-grid_dt]:text-caption [&_.detail-grid_dt]:font-semibold [&_.detail-grid_dt]:uppercase [&_.detail-grid_dt]:tracking-wide [&_.detail-grid_dt]:text-text-secondary [&_.detail-grid_dd]:mt-1 [&_.detail-grid_dd]:break-words [&_.detail-grid_dd]:text-body-small [&_.filters]:grid [&_.filters]:gap-3 [&_.filters]:rounded-surface [&_.filters]:border [&_.filters]:border-border-default [&_.filters]:bg-surface-card [&_.filters]:p-3 [&_.filters]:shadow-sm sm:[&_.filters]:grid-cols-2 sm:[&_.filters]:p-4 lg:[&_.filters]:grid-cols-3 xl:[&_.filters]:grid-cols-4 [&_.filters>label]:grid [&_.filters>label]:gap-1.5 [&_.filters>label]:text-label [&_.filters>label]:font-semibold [&_.filters>label]:text-text-secondary [&_.filters_input]:min-h-11 [&_.filters_input]:rounded-control [&_.filters_input]:border [&_.filters_input]:border-input [&_.filters_input]:bg-surface [&_.filters_input]:px-3 [&_.filters_select]:min-h-11 [&_.filters_select]:rounded-control [&_.filters_select]:border [&_.filters_select]:border-input [&_.filters_select]:bg-surface [&_.filters_select]:px-3 [&_.filters_.checkbox-inline]:flex [&_.filters_.checkbox-inline]:min-h-11 [&_.filters_.checkbox-inline]:items-center [&_.filters_.checkbox-inline]:gap-2 [&_.filters_.checkbox-inline_input]:size-4 [&_.form-grid]:grid [&_.form-grid]:gap-4 sm:[&_.form-grid]:grid-cols-2 [&_.form-grid>label]:min-w-0 [&_.form-grid>label]:text-label [&_.form-grid>label]:font-semibold [&_.form-grid_textarea]:min-h-24 [&_.form-grid_.actions]:sm:col-span-2 [&_.table-wrap]:w-full [&_.table-wrap]:overflow-x-auto [&_.table-wrap]:rounded-surface [&_.table-wrap]:border [&_.table-wrap]:border-border-default [&_.table-wrap]:bg-surface-card [&_.table-wrap]:shadow-sm [&_.table-wrap_table]:min-w-full [&_.table-wrap]:text-body-small [&_.table-wrap_th]:whitespace-nowrap [&_.table-wrap_th]:bg-surface-muted [&_.table-wrap_th]:text-caption [&_.table-wrap_th]:font-bold [&_.table-wrap_th]:uppercase [&_.table-wrap_th]:tracking-wide [&_.table-wrap_td]:align-middle [&_.table-wrap_td]:py-3 [&_.table-wrap_tr:last-child_td]:border-b-0 [&_.table-wrap_tr:hover_td]:bg-surface-muted [&_.pagination]:mt-3 [&_.card]:rounded-surface [&_.card]:border-border-default [&_.card]:shadow-sm [&_.stat-grid]:gap-3 [&_.stat-card]:rounded-control [&_.stat-card]:p-3 [&_.report-grid]:gap-3 [&_.modal]:w-full [&_.modal]:max-w-3xl [&_.modal]:rounded-overlay [&_.modal]:p-4 sm:[&_.modal]:p-6"
    >
      <PageHeader context="Inventario" title={title} description={description} actions={actions} />
      {children}
    </PageContainer>
  )
}
