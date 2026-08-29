import { useRef, useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { StatusBadge } from '@/shared/ui/StatusBadge'
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
          <dl className="detail-grid">
            <div><dt>Nombre</dt><dd>{detailQuery.data.fullName}</dd></div>
            <div><dt>Identificación</dt><dd>{detailQuery.data.identification}</dd></div>
            <div><dt>Fecha de nacimiento</dt><dd>{formatDate(detailQuery.data.birthDate)}</dd></div>
            <div><dt>Género</dt><dd>{detailValue(detailQuery.data.gender)}</dd></div>
            <div><dt>Teléfono</dt><dd>{detailQuery.data.phoneCountryCode && detailQuery.data.phoneNationalNumber ? `${detailQuery.data.phoneCountryCode} ${detailQuery.data.phoneNationalNumber}` : detailValue(detailQuery.data.phone)}</dd></div>
            <div><dt>Correo electrónico</dt><dd>{detailValue(detailQuery.data.email)}</dd></div>
            <div><dt>Dirección</dt><dd>{detailQuery.data.address}</dd></div>
            <div><dt>Ocupación</dt><dd>{detailValue(detailQuery.data.occupation)}</dd></div>
            <div><dt>Lugar de trabajo</dt><dd>{detailValue(detailQuery.data.workplace)}</dd></div>
            <div><dt>Tipo de afiliado</dt><dd>{detailValue(detailQuery.data.affiliateType)}</dd></div>
            <div><dt>Fecha de afiliación</dt><dd>{formatDate(detailQuery.data.affiliationDate)}</dd></div>
            <div><dt>Estado</dt><dd><StatusBadge variant={detailQuery.data.status === 'ACTIVE' ? 'success' : 'neutral'}>{affiliateStatusLabel[detailQuery.data.status]}</StatusBadge></dd></div>
          </dl>
          {statusError && <ErrorState title="No fue posible actualizar el estado" message={statusError} />}
          <div className="actions">
            <button type="button" onClick={() => onEdit(detailQuery.data)} disabled={statusBusy}>Editar afiliado</button>
            {detailQuery.data.status === 'ACTIVE' ? (
              <button className="danger" type="button" onClick={() => { setStatusError(''); setPendingAction('deactivate') }} disabled={statusBusy}>Desactivar afiliado</button>
            ) : (
              <button className="primary" type="button" onClick={() => { setStatusError(''); setPendingAction('activate') }} disabled={statusBusy}>Activar afiliado</button>
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
