import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { ErrorState } from '@/shared/ui/ErrorState'
import { FormField } from '@/shared/ui/FormField'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { useAffiliateRequestDetail, useAffiliateRequestMutations } from '../hooks/useAffiliateRequestsQueries'
import type { AffiliateRequestStatus } from '../model/affiliateRequests.types'

const statusPresentation: Record<AffiliateRequestStatus, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  APPROVED: { label: 'Aprobada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'danger' },
}

function valueOrFallback(value: string | null | undefined) {
  return value?.trim() || 'No especificado'
}

function formatBirthDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value))
}

function formatTimestamp(value: string | null) {
  return value ? new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(value)) : 'No especificado'
}

function formatPhone(phoneCountryCode: string | null, phoneNationalNumber: string | null, phone: string | null) {
  if (phoneNationalNumber?.trim()) return [phoneCountryCode?.trim(), phoneNationalNumber.trim()].filter(Boolean).join(' ')
  return phone
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="min-w-0"><dt className="text-caption font-semibold uppercase tracking-wide text-text-secondary">{label}</dt><dd className="mt-1 break-words whitespace-pre-wrap text-body-small text-text-primary">{valueOrFallback(value)}</dd></div>
}

function getMutationErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data as { message?: string | string[] } | undefined
    if (Array.isArray(message?.message)) return message.message.join('. ')
    if (typeof message?.message === 'string') return message.message
    if (error.response?.status === 409) return 'Esta solicitud ya fue procesada o cambió de estado. Actualiza la información e inténtalo nuevamente.'
  }

  return getErrorMessage(error, 'No fue posible procesar la solicitud. Intente nuevamente.')
}

export function AffiliateRequestDetail({ requestId, onClose }: { requestId: number; onClose: () => void }) {
  const detailQuery = useAffiliateRequestDetail(requestId)
  const { approve, reject } = useAffiliateRequestMutations()
  const [dialog, setDialog] = useState<'detail' | 'approve-confirm' | 'reject-reason' | 'reject-confirm'>('detail')
  const [rejectionReason, setRejectionReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [actionError, setActionError] = useState('')
  const [success, setSuccess] = useState('')
  const [submissionPending, setSubmissionPending] = useState(false)
  const submitting = useRef(false)
  const actionVersion = useRef(0)
  const request = detailQuery.data
  const busy = submissionPending || approve.isPending || reject.isPending

  useEffect(() => {
    actionVersion.current += 1
    submitting.current = false
    setSubmissionPending(false)
    setDialog('detail')
    setRejectionReason('')
    setReasonError('')
    setActionError('')
    setSuccess('')
  }, [requestId])

  const isLocked = () => submitting.current || approve.isPending || reject.isPending

  const returnToDetail = () => {
    if (!isLocked()) {
      setActionError('')
      setDialog('detail')
    }
  }

  const confirmApprove = async () => {
    if (isLocked()) return
    submitting.current = true
    setSubmissionPending(true)
    const version = actionVersion.current
    setActionError('')

    try {
      await approve.mutateAsync(requestId)
      if (version !== actionVersion.current) return
      setSuccess('Solicitud aprobada correctamente.')
      setDialog('detail')
    } catch (error) {
      if (version !== actionVersion.current) return
      setActionError(getMutationErrorMessage(error))
      const refreshed = await detailQuery.refetch()
      if (version === actionVersion.current && refreshed?.data && refreshed.data.status !== 'PENDING') {
        setRejectionReason('')
        setReasonError('')
        setDialog('detail')
      }
    } finally {
      if (version === actionVersion.current) {
        submitting.current = false
        setSubmissionPending(false)
      }
    }
  }

  const continueReject = () => {
    if (isLocked()) return
    const trimmedReason = rejectionReason.trim()
    if (!trimmedReason) {
      setReasonError('Indique un motivo de rechazo.')
      return
    }

    setRejectionReason(trimmedReason)
    setReasonError('')
    setActionError('')
    setDialog('reject-confirm')
  }

  const confirmReject = async () => {
    if (isLocked()) return
    submitting.current = true
    setSubmissionPending(true)
    const version = actionVersion.current
    setActionError('')

    try {
      await reject.mutateAsync({ id: requestId, payload: { rejectionReason } })
      if (version !== actionVersion.current) return
      setSuccess('Solicitud rechazada correctamente.')
      setDialog('detail')
    } catch (error) {
      if (version !== actionVersion.current) return
      setActionError(getMutationErrorMessage(error))
      const refreshed = await detailQuery.refetch()
      if (version === actionVersion.current && refreshed?.data && refreshed.data.status !== 'PENDING') {
        setRejectionReason('')
        setReasonError('')
        setDialog('detail')
      }
    } finally {
      if (version === actionVersion.current) {
        submitting.current = false
        setSubmissionPending(false)
      }
    }
  }

  if (dialog === 'approve-confirm') {
    return <ConfirmDialog title="¿Aprobar esta solicitud?" message="La solicitud de afiliación será aprobada." confirmLabel="Aprobar" busy={busy} error={actionError} onConfirm={() => void confirmApprove()} onClose={returnToDetail} />
  }

  if (dialog === 'reject-confirm') {
    return <ConfirmDialog title="¿Rechazar esta solicitud?" message={`La solicitud será marcada como rechazada. Motivo: ${rejectionReason}`} confirmLabel="Rechazar" danger busy={busy} error={actionError} onConfirm={() => void confirmReject()} onClose={returnToDetail} />
  }

  if (dialog === 'reject-reason') {
    return <Modal title="Rechazar solicitud" onClose={returnToDetail} busy={busy}><div className="space-y-4"><FormField id="rejection-reason" label="Motivo de rechazo" error={reasonError || undefined}><Textarea value={rejectionReason} onChange={(event) => { setRejectionReason(event.target.value); setReasonError('') }} /></FormField><div className="flex flex-wrap justify-end gap-3"><Button variant="outline" type="button" onClick={returnToDetail} disabled={busy}>Cancelar</Button><Button variant="danger" type="button" onClick={continueReject} disabled={busy}>Continuar</Button></div></div></Modal>
  }

  return (
    <Modal title="Detalle de solicitud de afiliación" onClose={onClose}>
      <div className="max-h-[70vh] overflow-y-auto px-1 pb-1">
        {detailQuery.isPending ? (
          <LoadingState label="Cargando detalle de solicitud..." />
        ) : detailQuery.isError ? (
          <ErrorState title="No fue posible cargar la solicitud" message={getErrorMessage(detailQuery.error, 'Intente nuevamente.')} action={<Button variant="outline" type="button" onClick={() => void detailQuery.refetch()}>Reintentar</Button>} />
        ) : request ? (
            <div className="space-y-7">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-4">
               <div><p className="text-body-small text-text-secondary">Solicitud #{request.id}</p><p className="text-heading-3 font-semibold text-text-primary">{request.fullName}</p></div>
              <StatusBadge variant={statusPresentation[request.status].variant}>{statusPresentation[request.status].label}</StatusBadge>
            </div>
            <StatusMessage error={actionError} success={success} />
             <section aria-labelledby="identity-heading"><h3 id="identity-heading" className="text-heading-3 font-semibold text-text-primary">Identidad</h3><dl className="mt-3 grid gap-4 sm:grid-cols-2"><DetailField label="Identificación" value={request.identification} /><DetailField label="Tipo de identificación" value={request.identificationType} /><DetailField label="Fecha de nacimiento" value={formatBirthDate(request.birthDate)} /><DetailField label="Género" value={request.gender} /></dl></section>
             <section aria-labelledby="contact-heading"><h3 id="contact-heading" className="text-heading-3 font-semibold text-text-primary">Contacto</h3><dl className="mt-3 grid gap-4 sm:grid-cols-2"><DetailField label="Correo electrónico" value={request.email} /><DetailField label="Teléfono" value={formatPhone(request.phoneCountryCode, request.phoneNationalNumber, request.phone)} /><DetailField label="Dirección" value={request.address} /></dl></section>
             <section aria-labelledby="employment-heading"><h3 id="employment-heading" className="text-heading-3 font-semibold text-text-primary">Información laboral</h3><dl className="mt-3 grid gap-4 sm:grid-cols-2"><DetailField label="Ocupación" value={request.occupation} /><DetailField label="Lugar de trabajo" value={request.workplace} /></dl></section>
             <section aria-labelledby="request-heading"><h3 id="request-heading" className="text-heading-3 font-semibold text-text-primary">Solicitud</h3><dl className="mt-3 grid gap-4"><DetailField label="Motivo de afiliación" value={request.affiliationReason} /></dl></section>
             <section aria-labelledby="review-heading"><h3 id="review-heading" className="text-heading-3 font-semibold text-text-primary">Revisión</h3><dl className="mt-3 grid gap-4 sm:grid-cols-2"><DetailField label="Revisada el" value={formatTimestamp(request.reviewedAt)} /><DetailField label="Revisada por" value={request.reviewedBy ? `${request.reviewedBy.fullName} (${request.reviewedBy.email})` : null} />{request.status === 'REJECTED' && <DetailField label="Motivo de rechazo" value={request.rejectionReason} />}</dl></section>
             {request.status === 'PENDING' && <div className="flex flex-wrap justify-end gap-3 border-t border-border-default pt-4"><Button type="button" onClick={() => { if (!isLocked()) { setActionError(''); setDialog('approve-confirm') } }} disabled={busy}>Aprobar solicitud</Button><Button variant="danger" type="button" onClick={() => { if (!isLocked()) { setActionError(''); setDialog('reject-reason') } }} disabled={busy}>Rechazar solicitud</Button></div>}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
