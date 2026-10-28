import { AlertTriangle, Info } from 'lucide-react'
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
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

type DetailTab = 'general' | 'contact'

function detailValue(value: string | null) {
  return value || '—'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(value))
}

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase()
}

function avatarTone(fullName: string) {
  const value = Array.from(fullName).reduce((total, character) => total + character.charCodeAt(0), 0)
  return ['bg-brand-primary/15 text-brand-primary', 'bg-brand-accent/25 text-brand-brown', 'bg-status-info-surface text-status-info', 'bg-status-success-surface text-status-success'][value % 4]
}

function DetailItem({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <div className={`min-w-0 ${className}`}><dt className="text-caption font-bold uppercase tracking-[0.08em] text-text-secondary">{label}</dt><dd className="mt-0.5 break-words text-body-small text-text-primary">{children}</dd></div>
}

export function AffiliateDetailsModal({ id, onClose, onEdit }: AffiliateDetailsModalProps) {
  const detailQuery = useAffiliateDetail(id)
  const { activate, deactivate } = useAffiliateMutations()
  const [activeTab, setActiveTab] = useState<DetailTab>('general')
  const [pendingAction, setPendingAction] = useState<'activate' | 'deactivate' | null>(null)
  const [statusError, setStatusError] = useState('')
  const statusRequestInFlight = useRef(false)
  const statusBusy = activate.isPending || deactivate.isPending
  const affiliate = detailQuery.data

  const changeStatus = async () => {
    if (!pendingAction || statusBusy || statusRequestInFlight.current) return

    statusRequestInFlight.current = true
    setStatusError('')
    try {
      await (pendingAction === 'activate' ? activate.mutateAsync(id) : deactivate.mutateAsync(id))
      setPendingAction(null)
    } catch (error) {
      setStatusError(getErrorMessage(error, 'No fue posible actualizar el estado del afiliado.'))
    } finally {
      statusRequestInFlight.current = false
    }
  }

  const openStatusConfirmation = (action: 'activate' | 'deactivate') => {
    setStatusError('')
    setPendingAction(action)
  }

  const closeStatusConfirmation = () => {
    if (!statusBusy) {
      setStatusError('')
      setPendingAction(null)
    }
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const nextTab = event.key === 'ArrowLeft' || event.key === 'Home' ? 'general' : 'contact'
    setActiveTab(nextTab)
    document.getElementById(`affiliate-${nextTab}-tab`)?.focus()
  }

  const footer = affiliate ? (
    <>
      <Button variant="outline" type="button" onClick={onClose} disabled={statusBusy}>Cerrar</Button>
      <Button variant="outline" type="button" onClick={() => onEdit(affiliate)} disabled={statusBusy}>Editar afiliado</Button>
      {affiliate.status === 'ACTIVE' ? (
        <Button variant="danger" type="button" onClick={() => openStatusConfirmation('deactivate')} disabled={statusBusy}>Desactivar afiliado</Button>
      ) : (
        <Button type="button" onClick={() => openStatusConfirmation('activate')} disabled={statusBusy}>Activar afiliado</Button>
      )}
    </>
  ) : undefined

  return (
    <>
      <Modal title="Detalle de afiliado" onClose={onClose} busy={detailQuery.isFetching || statusBusy} footer={footer}>
        {detailQuery.isPending ? (
          <LoadingState label="Cargando detalle del afiliado..." />
        ) : detailQuery.isError ? (
          <ErrorState message={getErrorMessage(detailQuery.error, 'No fue posible cargar el detalle del afiliado.')} action={<button type="button" onClick={() => void detailQuery.refetch()}>Reintentar</button>} />
        ) : affiliate ? (
          <div className="min-w-0">
            <header className="flex min-w-0 items-center gap-3 border-b border-border-subtle pb-4">
              <span aria-hidden="true" className={`grid size-12 shrink-0 place-items-center rounded-full text-body font-bold ${avatarTone(affiliate.fullName)}`}>{initials(affiliate.fullName)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="font-heading text-heading-3 font-normal leading-tight text-text-primary">{affiliate.fullName}</h3>
                  <StatusBadge variant={affiliate.status === 'ACTIVE' ? 'success' : 'neutral'}>{affiliateStatusLabel[affiliate.status]}</StatusBadge>
                </div>
                <p className="mt-0.5 text-caption text-text-secondary">Afiliado desde el {formatDate(affiliate.affiliationDate)}</p>
              </div>
            </header>

            <div role="tablist" aria-label="Secciones del detalle de afiliado" className="-mb-px flex overflow-x-auto border-b border-border-default">
              <button type="button" role="tab" aria-selected={activeTab === 'general'} aria-controls="affiliate-general-panel" id="affiliate-general-tab" onClick={() => setActiveTab('general')} onKeyDown={handleTabKeyDown} className={`shrink-0 border-b-2 px-3 py-3 text-caption font-semibold transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-focus ${activeTab === 'general' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Información general</button>
              <button type="button" role="tab" aria-selected={activeTab === 'contact'} aria-controls="affiliate-contact-panel" id="affiliate-contact-tab" onClick={() => setActiveTab('contact')} onKeyDown={handleTabKeyDown} className={`shrink-0 border-b-2 px-3 py-3 text-caption font-semibold transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-focus ${activeTab === 'contact' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Contacto y actividad</button>
              <span aria-disabled="true" className="shrink-0 border-b-2 border-transparent px-3 py-3 text-caption font-semibold text-text-secondary/60">Observaciones</span>
            </div>

            {activeTab === 'general' ? (
              <div role="tabpanel" id="affiliate-general-panel" aria-labelledby="affiliate-general-tab" className="space-y-5 py-4">
                <section aria-labelledby="affiliate-profile-heading">
                  <h4 id="affiliate-profile-heading" className="font-heading text-body font-semibold text-text-primary">Datos personales</h4>
                  <dl className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-3">
                    <DetailItem label="Nombre completo">{affiliate.fullName}</DetailItem>
                    <DetailItem label="Identificación"><span className="tabular-nums">{affiliate.identification}</span></DetailItem>
                    <DetailItem label="Fecha de nacimiento"><span className="tabular-nums">{formatDate(affiliate.birthDate)}</span></DetailItem>
                    <DetailItem label="Género">{detailValue(affiliate.gender)}</DetailItem>
                  </dl>
                </section>
                <section aria-labelledby="affiliate-affiliation-heading" className="border-t border-border-subtle pt-4">
                  <h4 id="affiliate-affiliation-heading" className="font-heading text-body font-semibold text-text-primary">Información de afiliación</h4>
                  <dl className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-3">
                    <DetailItem label="Tipo de afiliado">{detailValue(affiliate.affiliateType)}</DetailItem>
                    <DetailItem label="Fecha de afiliación"><span className="tabular-nums">{formatDate(affiliate.affiliationDate)}</span></DetailItem>
                    <DetailItem label="Estado actual"><StatusBadge variant={affiliate.status === 'ACTIVE' ? 'success' : 'neutral'}>{affiliateStatusLabel[affiliate.status]}</StatusBadge></DetailItem>
                  </dl>
                </section>
              </div>
            ) : (
              <section role="tabpanel" id="affiliate-contact-panel" aria-labelledby="affiliate-contact-tab" className="py-4">
                <h4 id="affiliate-contact-heading" className="font-heading text-body font-semibold text-text-primary">Contacto y actividad</h4>
                <dl className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2">
                  <DetailItem label="Teléfono">{affiliate.phoneCountryCode && affiliate.phoneNationalNumber ? `${affiliate.phoneCountryCode} ${affiliate.phoneNationalNumber}` : detailValue(affiliate.phone)}</DetailItem>
                  <DetailItem label="Correo electrónico">{detailValue(affiliate.email)}</DetailItem>
                  <DetailItem label="Dirección" className="sm:col-span-2">{affiliate.address}</DetailItem>
                  <DetailItem label="Ocupación">{detailValue(affiliate.occupation)}</DetailItem>
                  <DetailItem label="Lugar de trabajo">{detailValue(affiliate.workplace)}</DetailItem>
                </dl>
              </section>
            )}
          </div>
        ) : null}
      </Modal>

      {pendingAction && affiliate ? (
        <Modal
          title={pendingAction === 'deactivate' ? 'Desactivar afiliado' : 'Activar afiliado'}
          onClose={closeStatusConfirmation}
          busy={statusBusy}
          footer={<><Button variant="outline" type="button" onClick={closeStatusConfirmation} disabled={statusBusy}>Cancelar</Button><Button variant={pendingAction === 'deactivate' ? 'danger' : 'default'} type="button" onClick={() => void changeStatus()} loading={statusBusy}>{pendingAction === 'deactivate' ? 'Desactivar' : 'Activar'}</Button></>}
        >
          {pendingAction === 'deactivate' ? (
            <div className="space-y-5 text-center">
              <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-full bg-status-warning-surface text-status-warning"><AlertTriangle className="size-6" /></span>
              <div>
                <p className="text-body-small text-text-primary">Estás por desactivar a <strong>{affiliate.fullName}</strong>.</p>
                <p className="mt-2 text-body-small text-text-secondary">Esta acción cambiará su estado a <strong className="text-text-primary">Inactivo</strong> y limitará su acceso a determinadas funciones del sistema.</p>
              </div>
              <div className="flex gap-2 rounded-control bg-status-info-surface p-3 text-left text-caption text-status-info">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>Esta acción puede revertirse posteriormente desde el detalle del afiliado.</p>
              </div>
              {statusError && <p role="alert" className="rounded-control border border-status-danger/30 bg-status-danger-surface p-3 text-left text-caption text-status-danger">{statusError}</p>}
            </div>
          ) : (
            <div className="space-y-3 text-body-small text-text-secondary"><p>Activarás a <strong className="text-text-primary">{affiliate.fullName}</strong>.</p><p>Recuperará el estado <strong className="text-text-primary">Activo</strong>.</p>{statusError && <p role="alert" className="rounded-control border border-status-danger/30 bg-status-danger-surface p-3 text-caption text-status-danger">{statusError}</p>}</div>
          )}
        </Modal>
      ) : null}
    </>
  )
}
