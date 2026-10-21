import { useRef, useState, type ReactNode } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Button } from '@/shared/ui/button'
import { useAffiliateDetail, useAffiliateMutations } from '../hooks/useAffiliatesQueries'
import { affiliateStatusLabel } from '../model/affiliateStatus'
import type { Affiliate } from '../model/affiliates.types'

type AffiliateDetailsModalProps = {
  id: number
  onClose: () => void
  onEdit: (affiliate: Affiliate) => void
}

function detailValue(value: string | null) {
  return value || '—'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(value))
}

function DetailItem({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <div className={`min-w-0 ${className}`}><dt className="text-caption font-bold uppercase tracking-[0.08em] text-text-secondary">{label}</dt><dd className="mt-1 break-words text-body-small text-text-primary">{children}</dd></div>
}

export function AffiliateDetailsModal({ id, onClose, onEdit }: AffiliateDetailsModalProps) {
  const detailQuery = useAffiliateDetail(id)
  const { activate, deactivate } = useAffiliateMutations()
  const [pendingAction, setPendingAction] = useState<'activate' | 'deactivate' | null>(null)
  const [statusError, setStatusError] = useState('')
  const statusRequestInFlight = useRef(false)
  const statusBusy = activate.isPending || deactivate.isPending

  const changeStatus = async () => {
    if (!pendingAction || statusBusy || statusRequestInFlight.current) return

    statusRequestInFlight.current = true
    try {
      await (pendingAction === 'activate' ? activate.mutateAsync(id) : deactivate.mutateAsync(id))
      setPendingAction(null)
    } catch (error) {
      setStatusError(getErrorMessage(error, 'No fue posible actualizar el estado del afiliado.'))
      setPendingAction(null)
    } finally {
      statusRequestInFlight.current = false
    }
  }

  return (
    <Modal title="Detalle de afiliado" onClose={onClose} busy={detailQuery.isFetching || statusBusy}>
      {detailQuery.isPending ? (
        <LoadingState label="Cargando detalle del afiliado..." />
      ) : detailQuery.isError ? (
        <ErrorState message={getErrorMessage(detailQuery.error, 'No fue posible cargar el detalle del afiliado.')} action={<button type="button" onClick={() => void detailQuery.refetch()}>Reintentar</button>} />
      ) : detailQuery.data ? (
        <>
          <div className="space-y-6">
            <section aria-labelledby="affiliate-profile-heading"><h3 id="affiliate-profile-heading" className="text-heading-3 font-semibold text-text-primary">Perfil</h3><dl className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2"><DetailItem label="Nombre" className="sm:col-span-2"><span className="text-body font-semibold">{detailQuery.data.fullName}</span></DetailItem><DetailItem label="Identificación"><span className="tabular-nums">{detailQuery.data.identification}</span></DetailItem><DetailItem label="Fecha de nacimiento"><span className="tabular-nums">{formatDate(detailQuery.data.birthDate)}</span></DetailItem><DetailItem label="Género">{detailValue(detailQuery.data.gender)}</DetailItem></dl></section>
            <section aria-labelledby="affiliate-affiliation-heading" className="border-t border-border-default pt-5"><h3 id="affiliate-affiliation-heading" className="text-heading-3 font-semibold text-text-primary">Afiliación</h3><dl className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2"><DetailItem label="Tipo de afiliado">{detailValue(detailQuery.data.affiliateType)}</DetailItem><DetailItem label="Fecha de afiliación"><span className="tabular-nums">{formatDate(detailQuery.data.affiliationDate)}</span></DetailItem><DetailItem label="Estado"><StatusBadge variant={detailQuery.data.status === 'ACTIVE' ? 'success' : 'neutral'}>{affiliateStatusLabel[detailQuery.data.status]}</StatusBadge></DetailItem></dl></section>
            <section aria-labelledby="affiliate-contact-heading" className="border-t border-border-default pt-5"><h3 id="affiliate-contact-heading" className="text-heading-3 font-semibold text-text-primary">Contacto y actividad</h3><dl className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2"><DetailItem label="Teléfono">{detailQuery.data.phoneCountryCode && detailQuery.data.phoneNationalNumber ? `${detailQuery.data.phoneCountryCode} ${detailQuery.data.phoneNationalNumber}` : detailValue(detailQuery.data.phone)}</DetailItem><DetailItem label="Correo electrónico">{detailValue(detailQuery.data.email)}</DetailItem><DetailItem label="Dirección" className="sm:col-span-2">{detailQuery.data.address}</DetailItem><DetailItem label="Ocupación">{detailValue(detailQuery.data.occupation)}</DetailItem><DetailItem label="Lugar de trabajo">{detailValue(detailQuery.data.workplace)}</DetailItem></dl></section>
          </div>
          {statusError && <ErrorState title="No fue posible actualizar el estado" message={statusError} />}
          <div className="flex flex-col-reverse gap-3 border-t border-border-default pt-5 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={() => onEdit(detailQuery.data)} disabled={statusBusy}>Editar afiliado</Button>
            {detailQuery.data.status === 'ACTIVE' ? (
              <Button variant="danger" type="button" onClick={() => { setStatusError(''); setPendingAction('deactivate') }} disabled={statusBusy}>Desactivar afiliado</Button>
            ) : (
              <Button type="button" onClick={() => { setStatusError(''); setPendingAction('activate') }} disabled={statusBusy}>Activar afiliado</Button>
            )}
          </div>
          {pendingAction && <ConfirmDialog
            title={pendingAction === 'activate' ? 'Activar afiliado' : 'Desactivar afiliado'}
            message={pendingAction === 'activate' ? `Activarás a ${detailQuery.data.fullName}. Recuperará el estado Activo.` : `Desactivarás a ${detailQuery.data.fullName}. Quedará en estado Inactivo.`}
            confirmLabel={pendingAction === 'activate' ? 'Activar' : 'Desactivar'}
            danger={pendingAction === 'deactivate'}
            busy={statusBusy}
            onConfirm={() => void changeStatus()}
            onClose={() => setPendingAction(null)}
          />}
        </>
      ) : null}
    </Modal>
  )
}
